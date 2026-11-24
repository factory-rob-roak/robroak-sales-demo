# Infrastructure

Target: AWS static hosting (S3 bucket behind CloudFront) for the Vite build in `dist/`.

Nothing is provisioned yet. Infrastructure as code should live in this folder, and deploys should run from GitHub Actions using OIDC (no long-lived AWS keys in the repo or in GitHub secrets).
