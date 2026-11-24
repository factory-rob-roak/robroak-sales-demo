variable "aws_region" {
  description = "Region for the S3 bucket and IAM calls. CloudFront is global."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short name used to prefix resource names."
  type        = string
  default     = "photo-books"

  validation {
    condition     = can(regex("^[a-z0-9-]{3,32}$", var.project_name))
    error_message = "project_name must be 3-32 lowercase letters, digits, or hyphens."
  }
}

variable "bucket_name" {
  description = "Name of the site bucket. Defaults to <project_name>-site-<account id>."
  type        = string
  default     = null
}

variable "github_repository" {
  description = "GitHub repository allowed to deploy, as owner/name."
  type        = string
  default     = "factory-rob-roak/robroak-sales-demo"
}

variable "github_environment" {
  description = "GitHub Actions environment the deploy job runs in. Only that environment can assume the deploy role."
  type        = string
  default     = "production"
}

variable "create_github_oidc_provider" {
  description = "Create the GitHub OIDC identity provider. Set to false if the AWS account already has one for token.actions.githubusercontent.com."
  type        = bool
  default     = true
}

variable "price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_100"
}

variable "content_security_policy" {
  description = "Content-Security-Policy header sent with every response."
  type        = string
  default     = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
}

variable "noncurrent_version_retention_days" {
  description = "Days to keep overwritten or deleted object versions, for rollback."
  type        = number
  default     = 30
}
