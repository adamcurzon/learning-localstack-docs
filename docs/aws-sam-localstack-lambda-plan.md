# AWS SAM Java Lambda With LocalStack Plan

## Summary

Create a basic AWS Lambda application using Java 21, Gradle, AWS SAM, and LocalStack. The initial Lambda will return a simple "hello world" response and will be structured so it can later grow into a larger serverless application.

The project will also include a GitHub Actions deployment pipeline that deploys automatically from the `main` branch using AWS OIDC authentication.

## Goals

- Build a minimal Java 21 Lambda.
- Use Gradle for builds and dependency management.
- Use AWS SAM for local builds and AWS deployment.
- Use LocalStack for local AWS service emulation and testing.
- Deploy automatically from GitHub Actions when changes are pushed to `main`.
- Avoid long-lived AWS access keys in GitHub by using OIDC.

## Proposed Repository Structure

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml
├── docs/
│   └── aws-sam-localstack-lambda-plan.md
├── src/
│   ├── main/
│   │   └── java/
│   │       └── com/
│   │           └── example/
│   │               └── Handler.java
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── HandlerTest.java
├── build.gradle
├── docker-compose.yml
├── gradle.properties
├── samconfig.toml
├── settings.gradle
└── template.yaml
```

## Application Design

The first version will contain a single Lambda function:

- Runtime: `java21`
- Build system: Gradle
- Handler class: `com.example.Handler`
- Behavior: return an API Gateway REST response with body `{"message":"hello world"}`
- Infrastructure definition: AWS SAM `template.yaml`

The Lambda is exposed through API Gateway REST API at `GET /hello` for browser and curl access. Direct Lambda invocation remains useful for lower-level testing.

## Local Development

### Prerequisites

Install:

- JDK 21 or newer for local development. The build compiles with `--release 21` for AWS Lambda Java 21 compatibility.
- Gradle or the Gradle wrapper
- AWS SAM CLI
- Docker
- lstk or Docker Compose
- AWS CLI

### Gradle

Use Gradle to:

- Compile Java source.
- Run unit tests.
- Package the Lambda artifact.
- Manage dependencies such as the AWS Lambda Java core library and JUnit.

The initial dependencies should include:

- `com.amazonaws:aws-lambda-java-core`
- `com.amazonaws:aws-lambda-java-events`
- `org.junit.jupiter:junit-jupiter`

### AWS SAM

Use SAM to:

- Define the Lambda in `template.yaml`.
- Define the REST API and `GET /hello` route in `template.yaml`.
- Build the Lambda with `sam build`.
- Invoke the Lambda locally with `sam local invoke`.
- Deploy the stack to AWS with `sam deploy`.

The SAM template should define:

- One `AWS::Serverless::Function`
- One `AWS::Serverless::Api`
- HTTP route `GET /hello`
- Java 21 runtime
- Makefile build metadata that delegates packaging to Gradle
- Stack outputs containing the Lambda function name and REST API details

### LocalStack

Use LocalStack through `lstk` for local AWS emulation. Keep `docker-compose.yml` as supporting project configuration.

The first LocalStack setup should expose:

- Lambda
- CloudFormation
- IAM
- S3
- CloudWatch Logs

LocalStack should be used to validate that SAM packaging and Lambda deployment workflows are working locally before pushing to AWS.

## GitHub Actions Deployment

Create `.github/workflows/deploy.yml` with a single deployment workflow.

The workflow should:

- Trigger on pushes to `main`.
- Check out the repository.
- Install Java 21.
- Configure Gradle caching.
- Install or configure AWS SAM CLI.
- Authenticate to AWS using GitHub Actions OIDC.
- Run Gradle tests.
- Run `sam build`.
- Run `sam deploy --no-confirm-changeset --no-fail-on-empty-changeset`.

Use repository or environment variables for:

- AWS region
- SAM stack name
- SAM deployment bucket, if not allowing SAM to manage one
- AWS IAM role ARN for GitHub OIDC

Do not store long-lived AWS access keys in GitHub secrets.

## AWS OIDC Setup

Before the GitHub Actions workflow can deploy, AWS needs:

- An IAM OIDC identity provider for GitHub Actions.
- An IAM role trusted by the repository.
- Permissions for the role to deploy the SAM stack.

The trust policy should restrict access to:

- The expected GitHub organization or username.
- This repository.
- The `main` branch.

The deploy role needs permissions for:

- CloudFormation stack deployment
- Lambda creation and updates
- IAM role creation or passing for the Lambda execution role
- S3 artifact upload
- CloudWatch Logs resources created by the Lambda

For production use, tighten these permissions around the specific stack, artifact bucket, and role paths.

## Testing Strategy

### Unit Tests

Add a direct unit test for the Java handler.

The first test should verify:

- The handler returns HTTP status `200`.
- The response body contains `hello world`.
- The response content type is `application/json`.

### Local SAM Tests

Validate the app locally with:

```bash
./gradlew test
sam build
sam local invoke HelloWorldFunction
```

### LocalStack Tests

Validate local AWS deployment behavior with LocalStack:

```bash
lstk start --type aws --persist
lstk sam build
lstk sam deploy \
  --stack-name learning-localstack-dev \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --region eu-west-2
API_ID=$(lstk aws cloudformation describe-stacks \
  --stack-name learning-localstack-dev \
  --region eu-west-2 \
  --query "Stacks[0].Outputs[?OutputKey=='HelloWorldApiId'].OutputValue" \
  --output text)
curl "http://localhost:4566/_aws/execute-api/${API_ID}/local/hello"
```

Use `lstk sam` and `lstk aws` for LocalStack validation so SAM and AWS CLI commands are automatically pointed at the local emulator.

### CI Tests

GitHub Actions should fail before deployment if:

- Java compilation fails.
- Unit tests fail.
- `sam build` fails.

Deployment should only run after tests and build pass.

## Implementation Steps

1. Create the Gradle Java project structure.
2. Add the Java 21 Gradle configuration and dependencies.
3. Add the hello-world Lambda handler.
4. Add a direct unit test for the handler.
5. Add the SAM `template.yaml` with API Gateway REST API.
6. Add LocalStack Docker Compose configuration.
7. Add `samconfig.toml` for default deployment values.
8. Add the GitHub Actions deployment workflow.
9. Document local commands in the project README.
10. Run local Gradle tests and `sam build`.

## Acceptance Criteria

- `./gradlew test` passes.
- `sam build` succeeds.
- The Lambda can be invoked locally through SAM.
- The API can be opened locally at `GET /hello`.
- The Lambda can be deployed to LocalStack.
- The GitHub Actions workflow deploys from `main`.
- GitHub Actions uses OIDC, not static AWS access keys.
- The deployed API returns `{"message":"hello world"}`.

## Assumptions

- The repository starts from an empty project.
- Java 21 and Gradle are the chosen implementation baseline.
- The first Lambda is exposed by API Gateway REST API at `GET /hello`.
- AWS deployment targets a single initial environment named `dev` in `eu-west-2`.
- GitHub Actions deployment runs only from the `main` branch.
- AWS account bootstrapping for OIDC and IAM permissions is done once before the first deployment.
