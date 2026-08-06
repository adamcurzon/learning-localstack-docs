# Architecture

## Three CloudFormation Stacks, Two Environments

The application is made up of two backend stacks and one frontend stack:

| Stack | Environment | Deployment | Region | Purpose |
| --- | --- | --- | --- | --- |
| `learning-localstack-dev` | LocalStack | `./scripts/localstack-deploy` (`lstk sam deploy`) | `eu-west-2` by default | Local backend development and integration testing |
| `learning-localstack-dev` | AWS | Backend GitHub Actions (`sam deploy`) on pushes to `main` | `eu-west-2` | API and Lambda backend |
| `learning-localstack-frontend` | AWS | Frontend GitHub Actions (`sam deploy`) on pushes to `main` | `eu-west-2` | Amplify-hosted React frontend |

The backend LocalStack and AWS stacks are synthesized from the application repository's `template.yaml`. The frontend stack is synthesized from the frontend repository's SAM-compatible `template.yaml`. The backend application behavior is the same in LocalStack and AWS; the frontend stack is AWS-only because LocalStack is used for backend service emulation, not Amplify Hosting.

```text
                         Backend template.yaml
                       AWS SAM definition
                              |
                +-------------+-------------+
                |                           |
                v                           v
       LocalStack backend              AWS backend
   learning-localstack-dev      learning-localstack-dev
       (local emulator)             (eu-west-2)
                                            |
                                            | HelloWorldApiId
                                            v
                                  Frontend template.yaml
                                  AWS SAM definition
                                            |
                                            v
                                AWS frontend stack
                              learning-localstack-frontend
                                            |
                                            v
                                  AWS Amplify Hosting
                               React app, main branch
```

The backend stack name can be overridden locally with `SAM_STACK_NAME`; the default is `learning-localstack-dev`. The frontend workflow uses `FRONTEND_STACK_NAME=learning-localstack-frontend` and reads the backend API ID from `BACKEND_STACK_NAME=learning-localstack-dev`.

## Backend Resources In Each Stack

The backend `template.yaml` declares two top-level SAM resources. SAM expands them into the underlying CloudFormation resources, integrations, permissions, deployment, and stage:

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

## Frontend Amplify Stack

The frontend repository's `template.yaml` creates the AWS hosting resources:

- `FrontendApp` (`AWS::Amplify::App`) registers the private frontend repository with Amplify Hosting and configures the app for web hosting.
- `FrontendMainBranch` (`AWS::Amplify::Branch`) provisions the production `main` branch with automatic builds disabled. Its `VITE_API_BASE_URL` environment variable points to the deployed backend API.

The frontend workflow deploys this stack with the `ApiBaseUrl` and `GitHubAccessToken` parameters. `GitHubAccessToken` is marked `NoEcho` and allows Amplify to read the private repository. The workflow then explicitly starts an Amplify `RELEASE` job for the `main` branch.

The frontend stack exports:

| Output | Value |
| --- | --- |
| `AmplifyAppId` | Amplify application ID used to start release jobs |
| `AmplifyDefaultDomain` | Amplify default domain |
| `FrontendOrigin` | Production browser origin, `https://main.<amplify-app-id>.amplifyapp.com` |

The backend uses `FrontendOrigin` as its CORS allowlist value. The backend workflow requires the `FRONTEND_ORIGIN` repository variable before deployment. After the first Amplify deployment, or whenever the Amplify app is recreated and its origin changes, update that variable from the frontend stack's `FrontendOrigin` output and redeploy the backend stack.

The application repository currently pins the frontend submodule to the initial frontend commit. The Amplify infrastructure and release workflow are defined on the frontend repository's newer `main` branch, so the submodule pointer must be advanced separately before the application repository consumes those files directly.

## Request Flow

```text
Browser
    |
    v
Amplify Hosting (production main branch)
    |
    | React app calls VITE_API_BASE_URL
    v
API Gateway REST API (AWS backend stack)
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

For local backend development, a browser or HTTP client calls the LocalStack API instead:

```text
HTTP client
    |
    v
LocalStack API Gateway
    |
    v
LocalStack Lambda: com.example.Handler
    |
    v
JSON response
```

API Gateway selects the route and invokes the same Lambda handler with an API Gateway proxy event. The handler reads `event.path`, chooses the response, and returns a JSON body with `Content-Type: application/json`.

## Stack Outputs

The backend stacks expose:

| Output | Value |
| --- | --- |
| `HelloWorldApiId` | API Gateway REST API ID |
| `HelloWorldApiUrl` | AWS URL for the `/local/hello` endpoint |
| `HelloWorldFunctionName` | Deployed Lambda function name |
| `HelloWorldFunctionArn` | Deployed Lambda function ARN |

The frontend stack exposes `AmplifyAppId`, `AmplifyDefaultDomain`, and `FrontendOrigin`, described above. These outputs connect the frontend deployment to the backend API and CORS configuration.

## Deployment Flow

The frontend deployment depends on an existing backend stack, and the backend deployment requires a frontend origin for CORS. Bootstrap the relationship with an existing origin value or an initial frontend deployment, then use this flow:

1. Deploy `learning-localstack-dev` after configuring the required `FRONTEND_ORIGIN` repository variable.
2. The frontend workflow reads `HelloWorldApiId` from `learning-localstack-dev` and derives the AWS API base URL.
3. The frontend workflow deploys `learning-localstack-frontend`, passing the API URL and Amplify repository token.
4. The frontend workflow starts the Amplify `main` branch release job and displays `FrontendOrigin`.
5. Update `FRONTEND_ORIGIN` from that output and redeploy the backend so API CORS allows the hosted frontend.

## LocalStack And AWS Differences

LocalStack emulates the backend AWS services used by the application (`lambda`, `cloudformation`, `iam`, `s3`, `logs`, and `apigateway`). The local scripts provide dummy credentials and route `sam` and `aws` commands through the `lstk` wrapper:

```text
http://<api-id>.execute-api.localhost.localstack.cloud:4566/local/<route>
```

The AWS backend deployment runs after tests and `sam build` succeed. GitHub Actions assumes the configured deployment role through GitHub OIDC, and SAM deploys the stack to `eu-west-2` using the configured artifact bucket and CloudFormation execution role:

```text
https://<api-id>.execute-api.eu-west-2.amazonaws.com/local/<route>
```

The Amplify frontend is deployed only to AWS. Its workflow uses a separate OIDC role, the `AMPLIFY_GITHUB_ACCESS_TOKEN` secret, and the AWS Amplify service to build and host the React application.

## Source Of Truth

- Backend infrastructure, routes, and outputs: application `template.yaml`.
- Frontend Amplify infrastructure and outputs: frontend repository `template.yaml`.
- Frontend deployment automation: frontend repository `.github/workflows/deploy-amplify.yml`.
- Java request handling: application `src/main/java/com/example/Handler.java`.
- Frontend API configuration: frontend `src/config/environment.ts`.
- Build and packaging: application `build.gradle` and `Makefile`.
- Backend stack and region defaults: application `samconfig.toml`.
- LocalStack deployment: application `scripts/localstack-deploy`.
- Backend AWS deployment automation: application `.github/workflows/deploy.yml`.
- Public API contract: `docs/public/openapi.json`.
