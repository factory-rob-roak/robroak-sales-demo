output "bucket_name" {
  description = "Site bucket. Set as the AWS_S3_BUCKET repository variable."
  value       = aws_s3_bucket.site.bucket
}
