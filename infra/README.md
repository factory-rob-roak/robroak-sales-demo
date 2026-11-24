# Infrastructure

Terraform for static hosting of the Vite build (`dist/`) on AWS, plus the deploy workflow in `.github/workflows/deploy.yml`.

## What it creates

- **S3 bucket** for the site: private (all public access blocked, ACLs disabled), SSE-S3 encryption, versioning, TLS-only bucket policy, and expiry of old object versions after 30 days.
- **CloudFront distribution** that reads the bucket through Origin Access Control. It redirects HTTP to HTTPS and sends security headers (CSP, HSTS, `nosniff`, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy). A CloudFront Function serves `index.html` for client-side routes (paths with no file extension). `/assets/*` is cached for a year. Everything else follows the object's `Cache-Control`, and `index.html` is uploaded with `no-cache`.
- **GitHub OIDC identity provider** (optional, see `create_github_oidc_provider`) and an **IAM deploy role**. Only jobs in this repository's `production` environment can assume the role. It can list the bucket, put and delete objects in it, and create invalidations on the distribution. Nothing else.

No AWS keys are stored anywhere. GitHub Actions gets short-lived credentials through OIDC.

## Files

| File | Purpose |
|------|---------|
| `versions.tf` | Terraform and provider versions, S3 backend (partial config), provider |
| `variables.tf` | Inputs (table below) |
| `s3.tf` | Site bucket and bucket policy |
| `cloudfront.tf` | OAC, SPA rewrite function, cache and security header policies, distribution |
| `iam.tf` | GitHub OIDC provider and deploy role |
| `outputs.tf` | Values to copy into GitHub repository variables |
| `backend.hcl.example` | Template for the remote state settings |
| `terraform.tfvars.example` | Template for variable overrides |

## Variables

| Name | Default | Description |
|------|---------|-------------|
| `aws_region` | `us-east-1` | Region for the bucket. CloudFront is global. |
| `project_name` | `photo-books` | Prefix for resource names. |
| `bucket_name` | `<project_name>-site-<account id>` | Site bucket name. |
| `github_repository` | `factory-rob-roak/robroak-sales-demo` | Repository allowed to deploy. |
| `github_environment` | `production` | GitHub environment allowed to assume the deploy role. |
| `create_github_oidc_provider` | `true` | Set to `false` if the account already has a provider for `token.actions.githubusercontent.com` (an account can only have one). |
| `price_class` | `PriceClass_100` | CloudFront price class. |
| `content_security_policy` | strict `'self'` policy | CSP header. Widen it if the app starts loading from other origins (for example a live upload API). |
| `noncurrent_version_retention_days` | `30` | How long old object versions are kept for rollback. |

## Outputs

| Name | Use |
|------|-----|
| `bucket_name` | GitHub variable `AWS_S3_BUCKET` |
| `cloudfront_distribution_id` | GitHub variable `AWS_CLOUDFRONT_DISTRIBUTION_ID` |
| `deploy_role_arn` | GitHub variable `AWS_DEPLOY_ROLE_ARN` |
| `site_url` | Public URL |

## One-time bootstrap

A person with admin access to the AWS account runs these steps once. CI never runs `terraform apply`.

1. **Create the state bucket** (Terraform does not manage it). Pick a globally unique name:

   ```bash
   aws s3api create-bucket --bucket <state-bucket> --region us-east-1
   aws s3api put-bucket-versioning --bucket <state-bucket> \
     --versioning-configuration Status=Enabled
   aws s3api put-public-access-block --bucket <state-bucket> \
     --public-access-block-configuration \
     BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
   ```

   New buckets are encrypted with SSE-S3 by default. Outside `us-east-1`, add `--create-bucket-configuration LocationConstraint=<region>`.

2. **Configure the backend and variables:**

   ```bash
   cd infra
   cp backend.hcl.example backend.hcl            # set bucket (and region)
   cp terraform.tfvars.example terraform.tfvars  # optional overrides
   terraform init -backend-config=backend.hcl
   ```

   State locking uses an S3 lock file (`use_lockfile`), so no DynamoDB table is needed.

3. **Apply:**

   ```bash
   terraform plan -out=site.tfplan
   terraform apply site.tfplan
   terraform output
   ```

4. **Create the GitHub environment.** In the repository settings, add an environment named `production`. Under *Deployment branches and tags*, choose *Selected branches and tags* and allow only `main`. This is what limits the role to the main branch. Add required reviewers if you want a manual approval step.

5. **Add repository variables** (Settings > Secrets and variables > Actions > Variables, not secrets) from the outputs: `AWS_DEPLOY_ROLE_ARN`, `AWS_S3_BUCKET`, `AWS_CLOUDFRONT_DISTRIBUTION_ID`, and `AWS_REGION` if the bucket is not in `us-east-1`.

6. **Deploy:** run the *Deploy* workflow from the Actions tab, or push to `main`. Until all three required variables exist, the deploy job is skipped instead of failing.

## How a deploy works

`.github/workflows/deploy.yml` runs `npm ci` and `npm run build`, assumes the deploy role through OIDC, then:

1. Syncs `dist/assets/` with `Cache-Control: public, max-age=31536000, immutable`. Old hashed assets are kept so open tabs keep working. The versioning lifecycle rule does not remove them; clean them up by hand if the bucket grows.
2. Syncs the remaining files with `max-age=300` and deletes files that are no longer in the build.
3. Uploads `index.html` last with `Cache-Control: no-cache`.
4. Invalidates `/*` in CloudFront.

## Checks

`.github/workflows/infra.yml` runs on changes to `infra/` or the workflows. It runs `terraform fmt -check`, `terraform init -backend=false`, and `terraform validate` with no AWS credentials, and lints the workflows with actionlint. To run the same checks locally:

```bash
cd infra
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
```

## Not included yet

- Custom domain (needs an ACM certificate in `us-east-1` and DNS records).
- CloudFront access logs and AWS WAF.
