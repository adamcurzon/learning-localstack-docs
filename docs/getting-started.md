# Getting Started

This project is a Java 21 AWS Lambda application built with Gradle and AWS SAM. API Gateway exposes the Lambda through two routes:

| Method | Route | Response |
| --- | --- | --- |
| `GET` | `/hello` | `{"message":"hello world"}` |
| `GET` | `/ping` | `{"message":"pong"}` |

The same SAM template is used for local AWS emulation with LocalStack and deployment to AWS in `eu-west-2`.

## Prerequisites

Install and verify:

```bash
java --version
docker --version
sam --version
aws --version
lstk --version
```

The project uses the Gradle wrapper, so a global Gradle installation is not required.

## Clone The Repository

Clone with the documentation submodule:

```bash
git clone --recurse-submodules https://github.com/adamcurzon/learning-localstack.git
cd learning-localstack
```

If the repository was cloned without submodules:

```bash
git submodule update --init --recursive
```

## Run The First Checks

Run the Java tests and validate the SAM template:

```bash
./gradlew test
sam validate --region eu-west-2
sam build
```

Continue with [Local development](./local-development) to deploy the application to LocalStack, or read [AWS deployment](./aws-deployment) for the GitHub Actions path.

## Repository Layout

- `src/main/java/com/example/Handler.java`: Lambda request handling.
- `src/test/java/com/example/HandlerTest.java`: handler unit tests.
- `template.yaml`: SAM resources, API routes, and CloudFormation outputs.
- `build.gradle`: Java, dependency, test, and Lambda packaging configuration.
- `Makefile`: SAM makefile build integration.
- `samconfig.toml`: default SAM stack and region settings.
- `.github/workflows/deploy.yml`: automated AWS deployment from `main`.
