# AWS Setup And Deployment Plan

## Purpose

This document explains how the application is deployed to AWS and how the AWS resources work together. It describes the current development deployment in `eu-west-2` and the GitHub Actions authentication model.

LocalStack is used for local testing. The deployment described here targets real AWS and uses `sam` and `aws` commands rather than `lstk` commands.

## AWS Architecture

The application consists of one Lambda function exposed through an API Gateway REST API:

```text
Browser or HTTP client
        |
        v
API Gateway: GET /hello
        |
        v
Lambda: Java 21 handler
        |
        v
JSON response: {"message":"hello world"}
```

The SAM template is the source of truth for the application infrastructure. CloudFormation processes the template and creates or updates the AWS resources declared in it.

### API Gateway

`AWS::Serverless::Api` creates an API Gateway REST API with a `local` stage and a `GET /hello` route. The route is connected to `HelloWorldFunction` by the function event definition.

The deployed AWS URL follows this pattern:

```text
https://<api-id>.execute-api.eu-west-2.amazonaws.com/local/hello
```

The API Gateway URL is exposed through the `HelloWorldApiUrl` CloudFormation output.

### Lambda

`AWS::Serverless::Function` creates the Java 21 Lambda function. The function uses:

- Handler: `com.example.Handler::handleRequest`
- Runtime: `java21`
- Architecture: `x86_64`
- Timeout: 10 seconds
- Memory: 512 MB

The handler returns an API Gateway-compatible response with HTTP status `200`, JSON content type, and the message `hello world`.

### IAM

SAM creates a Lambda execution role for the function. The role is used by Lambda at runtime and grants the permissions required by the function and its logging configuration.

The GitHub Actions deployment role is separate from the Lambda execution role:

- The GitHub Actions role deploys and updates infrastructure.
- The Lambda execution role is assumed by the Lambda service while the function runs.

The deployment role needs permission to use CloudFormation and to create or update the resources declared by the SAM template. It also needs `iam:PassRole` for the Lambda execution role created by the stack.

### S3

SAM packages the Lambda deployment artifact and uploads it to an S3 bucket before CloudFormation deploys the stack. The workflow uses `--resolve-s3`, allowing SAM to create or reuse a managed deployment bucket.

This bucket stores deployment artifacts and is separate from the Lambda runtime. The function code is loaded by Lambda from the packaged artifact during deployment.

### CloudWatch Logs

Lambda writes invocation and runtime logs to CloudWatch Logs. These logs are the primary place to investigate runtime errors after a successful deployment.

## GitHub Actions Authentication

The workflow in `.github/workflows/deploy.yml` runs when code is pushed to `main`. It authenticates to AWS using GitHub Actions OIDC rather than a stored AWS access key.

The trust relationship is:

```text
GitHub Actions workflow
        |
        | OIDC token
        v
AWS IAM OIDC provider for token.actions.githubusercontent.com
        |
        | restricted trust policy
        v
GitHub Actions deployment role
        |
        v
AWS CloudFormation and SAM deployment
```

### One-time AWS setup

Before the workflow can deploy, the AWS account must have:

1. A GitHub Actions OIDC identity provider for `token.actions.githubusercontent.com`.
2. An IAM role trusted by that provider.
3. A trust policy restricted to this repository and the `main` branch.
4. Permissions allowing the role to deploy the SAM stack.
5. The role ARN stored in the GitHub repository secret `AWS_DEPLOY_ROLE_ARN`.

The initial OIDC provider and trust role must be created through an existing AWS administrator process or another bootstrap path. The normal application workflow cannot authenticate to AWS until this trust relationship already exists.

The trust policy should restrict the GitHub subject to the repository and branch, using a subject equivalent to:

```text
repo:<github-owner>/<repository>:ref:refs/heads/main
```

The deployment role should be scoped to the project wherever practical. For an initial development deployment, it requires access for CloudFormation, Lambda, API Gateway, S3 artifact handling, CloudWatch Logs, and IAM role creation or passing as required by the SAM stack.

## Deployment Flow

The workflow performs these steps:

1. Checks out the repository.
2. Installs Java 21.
3. Configures Gradle caching.
4. Installs the AWS SAM CLI.
5. Exchanges the GitHub OIDC token for temporary AWS credentials.
6. Runs `./gradlew test`.
7. Runs `sam build` to compile and package the Lambda.
8. Runs `sam deploy` in `eu-west-2`.
9. CloudFormation creates or updates the application resources.

The deployment uses:

- Stack name: `learning-localstack-dev`
- Region: `eu-west-2`
- Capability: `CAPABILITY_IAM`
- S3 artifact management: `--resolve-s3`
- Empty changesets: ignored with `--no-fail-on-empty-changeset`

The deployment stops before CloudFormation if tests or the SAM build fail.

## Repository Responsibilities

- `template.yaml` defines the Lambda, API Gateway route, IAM-related deployment behavior, and CloudFormation outputs.
- `build.gradle` defines Java compilation, dependencies, and tests.
- `Makefile` packages the Lambda artifact for SAM.
- `samconfig.toml` stores default SAM deployment values.
- `.github/workflows/deploy.yml` defines the automated AWS deployment.
- `src/main/java/com/example/Handler.java` contains the Lambda behavior.
- `src/test/java/com/example/HandlerTest.java` verifies the handler response.

The CloudFormation outputs provide:

- API Gateway ID.
- API Gateway URL.
- Lambda function name.
- Lambda function ARN.

## AWS Verification

After a successful GitHub Actions run, inspect the stack:

```bash
aws cloudformation describe-stacks \
  --stack-name learning-localstack-dev \
  --region eu-west-2
```

Print the deployed API URL:

```bash
aws cloudformation describe-stacks \
  --stack-name learning-localstack-dev \
  --region eu-west-2 \
  --query "Stacks[0].Outputs[?OutputKey=='HelloWorldApiUrl'].OutputValue" \
  --output text
```

Invoke the deployed API:

```bash
API_URL=$(aws cloudformation describe-stacks \
  --stack-name learning-localstack-dev \
  --region eu-west-2 \
  --query "Stacks[0].Outputs[?OutputKey=='HelloWorldApiUrl'].OutputValue" \
  --output text)

curl "$API_URL"
```

The expected response is:

```json
{"message":"hello world"}
```

View Lambda logs with:

```bash
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/learning-localstack-dev-hello-world \
  --region eu-west-2
```

## AWS And LocalStack Differences

The application template is shared between local and AWS deployments, but the command wrappers differ:

| Target | Deployment command | AWS region | Endpoint |
| --- | --- | --- | --- |
| AWS | `sam deploy` | `eu-west-2` | AWS service endpoints |
| LocalStack | `lstk sam deploy` | `eu-west-2` | LocalStack on port `4566` |

For LocalStack, use `lstk aws` to inspect the local CloudFormation stack and the LocalStack API Gateway URL documented in `docs/running-locally-with-localstack.md`. Do not use LocalStack credentials or endpoints for the GitHub Actions AWS deployment.

## Future Extensions

The current design is intentionally small. Future work can add:

- Separate development and production stack names.
- GitHub Environments with deployment approvals.
- Tighter IAM policies and dedicated role paths.
- API authentication and throttling.
- Custom domains and TLS configuration.
- CloudWatch alarms and structured application logging.
- Infrastructure-as-code management for the initial OIDC and IAM bootstrap resources.

These changes should be introduced separately from the initial hello-world deployment so that the deployment path remains easy to validate.

## Completion Criteria

The AWS setup is considered complete when:

- The GitHub OIDC provider and deployment role exist.
- `AWS_DEPLOY_ROLE_ARN` is configured in GitHub.
- A push to `main` starts the deployment workflow.
- Tests and `sam build` pass in GitHub Actions.
- CloudFormation creates or updates the stack in `eu-west-2`.
- The API Gateway URL returns `{"message":"hello world"}`.
- Lambda logs are available in CloudWatch.
- No long-lived AWS access keys are stored in GitHub.
