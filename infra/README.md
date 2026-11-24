# Infrastructure

Terraform for static hosting of the Vite build (`dist/`) on AWS.

## What it creates

- **S3 bucket** for the site: private (all public access blocked, ACLs disabled), SSE-S3 encryption, versioning, TLS-only bucket policy, and expiry of old object versions after 30 days.

## Files

| File | Purpose |
|------|---------|
| `versions.tf` | Terraform and provider versions, S3 backend (partial config), provider |
| `variables.tf` | Inputs (table below) |
| `s3.tf` | Site bucket and bucket policy |
| `outputs.tf` | Values to copy into GitHub repository variables |
| `backend.hcl.example` | Template for the remote state settings |
| `terraform.tfvars.example` | Template for variable overrides |

## Variables

| Name | Default | Description |
|------|---------|-------------|
| `aws_region` | `us-east-1` | Region for the bucket. |
| `project_name` | `photo-books` | Prefix for resource names. |
| `bucket_name` | `<project_name>-site-<account id>` | Site bucket name. |
| `github_repository` | `factory-rob-roak/robroak-sales-demo` | Repository that owns this stack (used in tags). |
| `noncurrent_version_retention_days` | `30` | How long old object versions are kept for rollback. |

## Outputs

| Name | Use |
|------|-----|
| `bucket_name` | GitHub variable `AWS_S3_BUCKET` |

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

## Checks

`.github/workflows/infra.yml` runs on changes to `infra/` or the workflows. It runs `terraform fmt -check`, `terraform init -backend=false`, and `terraform validate` with no AWS credentials, and lints the workflows with actionlint. To run the same checks locally:

```bash
cd infra
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
```
