# Local Development With LocalStack

This is the recommended path for running the application locally. LocalStack emulates the AWS services, while `lstk` points SAM and AWS CLI commands at the local emulator.

## Start LocalStack

Start the AWS service emulator with persisted state:

```bash
./scripts/localstack-start
```

Use dummy credentials for LocalStack commands:

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=eu-west-2
```

## Build And Test

Run the unit tests and build the SAM application:

```bash
./gradlew test
sam validate --region eu-west-2
sam build
```

To invoke the Lambda without deploying API Gateway:

```bash
sam local invoke HelloWorldFunction --event events/hello.json
```

## Deploy To LocalStack

Deploy the current SAM template to the local stack:

```bash
./scripts/localstack-deploy
```

Use `lstk sam` for LocalStack deployment. A plain `sam deploy` targets AWS credentials and endpoints instead.

## Test The API

The script resolves the API ID created by the stack and calls both routes:

```bash
./scripts/localstack-api-test
```

Expected responses:

```json
{"message":"hello world"}
```

```json
{"message":"pong"}
```

The script prints the LocalStack URLs. Open either URL in a browser if needed.

## Invoke The Deployed Lambda Directly

API Gateway is not involved in a direct Lambda invocation:

```bash
./scripts/localstack-invoke
```

## Inspect The Local Stack

```bash
lstk aws cloudformation describe-stacks \
  --stack-name learning-localstack-dev \
  --region eu-west-2

lstk aws lambda list-functions --region eu-west-2
lstk logs
```

## Reset And Redeploy

To remove all LocalStack state and deploy cleanly:

```bash
./scripts/localstack-reset
```

`lstk reset` removes every resource stored by LocalStack, not only this application. After restarting, repeat the build and deployment commands above.

## Stop LocalStack

```bash
lstk stop
```
