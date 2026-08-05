# Deploying The Hello World App To AWS

This guide deploys the main `learning-localstack` application to real AWS. The VitePress documentation site is deployed separately through GitHub Pages.

The application is deployed to `eu-west-2` using AWS SAM and GitHub Actions.

## Local Prerequisites

Install:

- Java 21 or newer
- AWS CLI
- AWS SAM CLI
- Docker for `sam local` testing

LocalStack and `lstk` are only required for local AWS service emulation. Do not use LocalStack credentials when deploying to real AWS.

Verify the tools:

```bash
java --version
aws --version
sam --version
docker --version
```

## Configure AWS Credentials Locally

Configure an AWS CLI profile with access to the target AWS account:

```bash
aws configure --profile learning-localstack-dev
```

Select that profile and region:

```bash
export AWS_PROFILE=learning-localstack-dev
export AWS_REGION=eu-west-2
```

Verify the account before deploying:

```bash
aws sts get-caller-identity
```

## Deploy From Your Local Machine

From the root of the application repository, run:

```bash
./gradlew test
sam validate --region eu-west-2
sam build
sam deploy
```

The existing `samconfig.toml` supplies the deployment defaults:

- Stack name: `learning-localstack-dev`
- Region: `eu-west-2`
- S3 artifact management
- `CAPABILITY_IAM`
- Non-interactive changeset behavior

The first deployment creates or updates the Lambda function, Lambda execution role, API Gateway REST API, API Gateway `local` stage, `GET /hello` route, CloudFormation outputs, and the SAM deployment artifact bucket.

## Test The Live API

Retrieve the API URL from CloudFormation:

```bash
API_URL=$(aws cloudformation describe-stacks \
  --stack-name learning-localstack-dev \
  --region eu-west-2 \
  --query "Stacks[0].Outputs[?OutputKey=='HelloWorldApiUrl'].OutputValue" \
  --output text)

echo "$API_URL"
curl "$API_URL"
```

Expected response:

```json
{"message":"hello world"}
```

On macOS, open the URL in the default browser:

```bash
open "$API_URL"
```

The URL follows this pattern:

```text
https://<api-id>.execute-api.eu-west-2.amazonaws.com/local/hello
```

The stage is currently named `local`, including when the application is deployed to AWS.

## GitHub Actions Authentication

The workflow at `.github/workflows/deploy.yml` runs when code is pushed to `main`. It:

1. Installs Java 21.
2. Installs the AWS SAM CLI.
3. Authenticates to AWS using GitHub Actions OIDC.
4. Runs the Gradle tests.
5. Runs `sam build`.
6. Runs `sam deploy` in `eu-west-2`.

OIDC uses short-lived AWS credentials and avoids storing long-lived AWS access keys in GitHub.

## Create The AWS OIDC Deployment Role

Before GitHub Actions can deploy, the AWS account needs:

- A GitHub Actions OIDC identity provider.
- An IAM role trusted by GitHub Actions.
- Permissions for the role to deploy the SAM stack.

AWS SAM can bootstrap an OIDC pipeline configuration:

```bash
sam pipeline bootstrap
```

When prompted, select:

- OIDC authentication
- GitHub Actions
- GitHub owner: `adamcurzon`
- Repository: `learning-localstack`
- Branch: `main`
- Region: `eu-west-2`

The deployment role needs access to the resources managed by the SAM stack, including CloudFormation, Lambda, API Gateway, S3, CloudWatch Logs, and IAM role passing.

Restrict the role trust policy to this repository and branch:

```text
repo:adamcurzon/learning-localstack:ref:refs/heads/main
```

Do not allow every repository or branch to assume the deployment role.

## Configure GitHub

In the main `learning-localstack` repository, open:

```text
Settings -> Secrets and variables -> Actions
```

Add this repository secret:

```text
Name: AWS_DEPLOY_ROLE_ARN
Value: arn:aws:iam::<account-id>:role/<deployment-role-name>
```

Do not add AWS access keys or secret keys to GitHub.

## Trigger A Deployment

Push a change to `main`:

```bash
git add .
git commit -m "Deploy hello world application"
git push origin main
```

Monitor the run under:

```text
GitHub repository -> Actions -> Deploy
```

The workflow must pass tests and `sam build` before CloudFormation is updated.

## Verify AWS Resources

Inspect the CloudFormation stack:

```bash
aws cloudformation describe-stacks \
  --stack-name learning-localstack-dev \
  --region eu-west-2
```

List the deployed Lambda function:

```bash
aws lambda list-functions \
  --region eu-west-2 \
  --query "Functions[?contains(FunctionName, 'learning-localstack-dev')]"
```

List Lambda log groups:

```bash
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/learning-localstack-dev \
  --region eu-west-2
```

## Official References

- [AWS SAM deployment](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-deploying.html)
- [AWS SAM GitHub Actions deployment](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/deploying-using-github.html)
- [AWS SAM OIDC pipelines](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/deploying-with-oidc.html)
- [GitHub Actions OIDC with AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
