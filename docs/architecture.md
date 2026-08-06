# Architecture

## Two CloudFormation Stacks, One Template

The application has two deployable CloudFormation stacks:

| Stack | Environment | Deployment | Region | Purpose |
| --- | --- | --- | --- | --- |
| `learning-localstack-dev` | LocalStack | `./scripts/localstack-deploy` (`lstk sam deploy`) | `eu-west-2` by default | Local development and integration testing |
| `learning-localstack-dev` | AWS | GitHub Actions (`sam deploy`) on pushes to `main` | `eu-west-2` | The shared AWS environment |

Both stacks are synthesized from the application repository's `template.yaml`. The logical resources and application behavior are the same; the endpoint, credentials, and CloudFormation backend change with the target environment.

```text
                         template.yaml
                       AWS SAM definition
                              |
                +-------------+-------------+
                |                           |
                v                           v
       LocalStack stack              AWS stack
   learning-localstack-dev      learning-localstack-dev
       (local emulator)             (eu-west-2)
                |                           |
                +-------------+-------------+
                              |
                    API Gateway REST API
                              |
                       Java 21 Lambda
                    com.example.Handler
```

The stack name can be overridden locally with `SAM_STACK_NAME`; the default is `learning-localstack-dev`. The AWS workflow sets the same name through `SAM_STACK_NAME`.

## Resources In Each Stack

`template.yaml` declares two top-level SAM resources. SAM expands them into the underlying CloudFormation resources, integrations, permissions, deployment, and stage:

- `HelloWorldApi` (`AWS::Serverless::Api`) creates an API Gateway REST API with the `local` stage. Its API tag is `${AWS::StackName}-api`.
- `HelloWorldFunction` (`AWS::Serverless::Function`) creates a Java 21 Lambda using the `com.example.Handler::handleRequest` handler. It uses x86_64 architecture, 512 MB memory, and a 10-second timeout. Its name is `${AWS::StackName}-hello-world`.
- The function is packaged from the application repository with the Gradle-backed Makefile (`Metadata.BuildMethod: makefile`).

The function is connected to the API through three API events:

| Method | Path | Response |
| --- | --- | --- |
| `GET` | `/` | `200`, `{"message":"learning-localstack-api"}` |
| `GET` | `/hello` | `200`, `{"message":"hello world"}` |
| `GET` | `/ping` | `200`, `{"message":"pong"}` |

For any other non-empty path, the handler returns `404` with `{"message":"not found"}`. A direct invocation without a path uses the hello-world response.

## Request Flow

```text
HTTP client
    |
    v
API Gateway REST API (local stage)
    | GET /, /hello, or /ping
    v
API Gateway proxy event
    |
    v
Java 21 Lambda: com.example.Handler
    |
    v
JSON response
```

API Gateway selects the route and invokes the same Lambda handler with an API Gateway proxy event. The handler reads `event.path`, chooses the response, and returns a JSON body with `Content-Type: application/json`.

## Stack Outputs

Each stack exposes the following CloudFormation outputs:

| Output | Value |
| --- | --- |
| `HelloWorldApiId` | API Gateway REST API ID |
| `HelloWorldApiUrl` | AWS URL for the `/local/hello` endpoint |
| `HelloWorldFunctionName` | Deployed Lambda function name |
| `HelloWorldFunctionArn` | Deployed Lambda function ARN |

The output values are useful for smoke tests and for discovering the generated resource names without reconstructing them from the stack name.

## LocalStack And AWS Differences

LocalStack emulates the AWS services used by the stack (`lambda`, `cloudformation`, `iam`, `s3`, `logs`, and `apigateway`). The local scripts provide dummy credentials and route `sam` and `aws` commands through the `lstk` wrapper:

```text
http://<api-id>.execute-api.localhost.localstack.cloud:4566/local/<route>
```

The AWS deployment runs after tests and `sam build` succeed. GitHub Actions assumes the configured deployment role through GitHub OIDC, and SAM deploys the stack to `eu-west-2` using the configured artifact bucket and CloudFormation execution role:

```text
https://<api-id>.execute-api.eu-west-2.amazonaws.com/local/<route>
```

The application template does not change between these deployments. Only the CloudFormation backend, credentials, endpoint hostname, and deployment command differ.

## Source Of Truth

- Infrastructure, routes, and outputs: `template.yaml`.
- Java request handling: `src/main/java/com/example/Handler.java`.
- Build and packaging: `build.gradle` and `Makefile`.
- Stack and region defaults: `samconfig.toml`.
- LocalStack deployment: `scripts/localstack-deploy`.
- AWS deployment automation: `.github/workflows/deploy.yml`.
- Public API contract: `docs/public/openapi.json`.
