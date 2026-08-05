# Deploying To AWS

The recommended AWS deployment path is GitHub Actions. A push to `main` runs tests, builds the SAM application, and deploys the stack to `eu-west-2` using short-lived AWS credentials from GitHub OIDC.

LocalStack is for local testing only. Do not use LocalStack credentials or `lstk` commands for AWS deployment.

## GitHub Actions Workflow

The workflow in `.github/workflows/deploy.yml`:

1. Installs Java 21 and the SAM CLI.
2. Authenticates with AWS through GitHub OIDC.
3. Runs `./gradlew test`.
4. Runs `sam build`.
5. Runs `sam deploy` with the configured artifact bucket and CloudFormation role.

The workflow runs only for pushes to `main`.

## AWS Defaults

| Setting | Value |
| --- | --- |
| Region | `eu-west-2` |
| Stack | `learning-localstack-dev` |
| API stage | `local` |
| Deployment trigger | Push to `main` |
| Authentication | GitHub Actions OIDC |

## AWS OIDC Setup

The AWS account must have:

- An OIDC provider for `https://token.actions.githubusercontent.com`.
- An IAM deployment role trusted by the repository and `main` branch.
- Permissions for CloudFormation, Lambda, API Gateway, S3 artifact handling, CloudWatch Logs, and required IAM role passing.

The trust policy must be restricted to this repository and branch. For repositories created under GitHub's newer immutable identity model, use the subject format supplied by GitHub for the repository identity.

## GitHub Secrets

Configure these encrypted repository secrets under **Settings -> Secrets and variables -> Actions**:

| Secret | Purpose |
| --- | --- |
| `AWS_DEPLOY_ROLE_ARN` | GitHub OIDC deployment role assumed by the workflow. |
| `SAM_ARTIFACT_BUCKET` | S3 bucket used for SAM deployment artifacts. |
| `SAM_CLOUDFORMATION_ROLE_ARN` | CloudFormation execution role used by SAM. |

Do not store AWS access keys in GitHub.

## Trigger A Deployment

Commit and push to `main`:

```bash
git add .
git commit -m "Deploy application"
git push origin main
```

Monitor the **Deploy** workflow in the repository's Actions tab. Deployment stops before CloudFormation if tests or the SAM build fail.

## Verify AWS

Inspect the stack:

```bash
aws cloudformation describe-stacks \
  --stack-name learning-localstack-dev \
  --region eu-west-2
```

Retrieve and test the deployed `/hello` endpoint:

```bash
API_URL=$(aws cloudformation describe-stacks \
  --stack-name learning-localstack-dev \
  --region eu-west-2 \
  --query "Stacks[0].Outputs[?OutputKey=='HelloWorldApiUrl'].OutputValue" \
  --output text)

curl "$API_URL"
```

The `/ping` route uses the same API ID:

```text
https://<api-id>.execute-api.eu-west-2.amazonaws.com/local/ping
```

Inspect Lambda logs with:

```bash
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/learning-localstack-dev \
  --region eu-west-2
```

## Local Versus AWS Commands

| Task | LocalStack | AWS |
| --- | --- | --- |
| Deploy | `lstk sam deploy` | GitHub Actions `sam deploy` |
| Inspect CloudFormation | `lstk aws cloudformation ...` | `aws cloudformation ...` |
| API hostname | `*.execute-api.localhost.localstack.cloud:4566` | `*.execute-api.eu-west-2.amazonaws.com` |
| Credentials | Dummy LocalStack credentials | GitHub OIDC temporary credentials |
