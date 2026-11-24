terraform {
  # 1.10+ is required for native S3 state locking (use_lockfile).
  required_version = ">= 1.10, < 2.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Partial configuration: values come from backend.hcl at init time.
  # See README.md for the one-time state bucket bootstrap.
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "terraform"
      Repo      = var.github_repository
    }
  }
}

data "aws_caller_identity" "current" {}

locals {
  bucket_name = coalesce(var.bucket_name, "${var.project_name}-site-${data.aws_caller_identity.current.account_id}")
}
