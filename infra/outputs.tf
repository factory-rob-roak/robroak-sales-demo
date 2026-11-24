output "bucket_name" {
  description = "Site bucket. Set as the AWS_S3_BUCKET repository variable."
  value       = aws_s3_bucket.site.bucket
}

output "cloudfront_distribution_id" {
  description = "Distribution ID. Set as the AWS_CLOUDFRONT_DISTRIBUTION_ID repository variable."
  value       = aws_cloudfront_distribution.site.id
}

output "deploy_role_arn" {
  description = "Role GitHub Actions assumes. Set as the AWS_DEPLOY_ROLE_ARN repository variable."
  value       = aws_iam_role.deploy.arn
}

output "site_url" {
  description = "Public HTTPS URL of the site."
  value       = "https://${aws_cloudfront_distribution.site.domain_name}"
}
