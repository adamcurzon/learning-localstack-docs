# Architecture

## Request Flow

```text
HTTP client
    |
    v
API Gateway REST API
    | GET /hello or GET /ping
    v
Java 21 Lambda: com.example.Handler
    |
    v
JSON response
```

The application uses one Lambda function for both routes. API Gateway selects the route, then invokes the same handler with an API Gateway proxy event containing the request path.

## SAM Resources

`template.yaml` defines:

- `HelloWorldApi`: an `AWS::Serverless::Api` REST API with the `local` stage.
- `HelloWorldFunction`: a Java 21 Lambda packaged through the Gradle-backed Makefile.
- `GET /hello`: returns `{"message":"hello world"}`.
- `GET /ping`: returns `{"message":"pong"}`.
- CloudFormation outputs for the API ID, API URL, Lambda name, and Lambda ARN.

SAM generates the API Gateway integrations, Lambda permissions, deployments, and stage resources from these declarations.

## Handler Behavior

The handler reads the API Gateway request path:

| Path | Status | Body |
| --- | --- | --- |
| `/hello` | `200` | `{"message":"hello world"}` |
| `/ping` | `200` | `{"message":"pong"}` |
| Other non-empty paths | `404` | `{"message":"not found"}` |

Direct SAM invocation without a path uses the hello-world response for the sample event.

## LocalStack And AWS

The same SAM template is used in both environments. Only the command wrapper and service endpoint differ:

- LocalStack uses `lstk sam` and `lstk aws` with dummy credentials.
- AWS deployment uses `sam` and `aws` through GitHub Actions with OIDC credentials.

LocalStack API URLs use:

```text
http://<api-id>.execute-api.localhost.localstack.cloud:4566/local/<route>
```

AWS API URLs use:

```text
https://<api-id>.execute-api.eu-west-2.amazonaws.com/local/<route>
```

## Source Of Truth

- Infrastructure and routes: `template.yaml`.
- Java behavior: `src/main/java/com/example/Handler.java`.
- Unit tests: `src/test/java/com/example/HandlerTest.java`.
- Build and packaging: `build.gradle` and `Makefile`.
- Deployment defaults: `samconfig.toml`.
- AWS automation: `.github/workflows/deploy.yml`.
- Public API contract: `docs/public/openapi.json`.
