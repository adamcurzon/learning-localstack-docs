# Running Locally With LocalStack

This guide shows how to build, deploy, invoke, inspect, and clean up the Lambda locally with LocalStack.

The current app contains one directly invoked Lambda:

- Function logical ID: `HelloWorldFunction`
- Stack name: `learning-localstack-dev`
- Region: `eu-west-2`
- HTTP route: `GET /hello`
- LocalStack endpoint: `http://localhost:4566`
- Sample event: `events/hello.json`

## Prerequisites

Install:

- JDK 21 or newer
- Docker
- AWS SAM CLI
- AWS CLI
- lstk

The project uses the Gradle wrapper, so a global Gradle installation is not required.

## Start LocalStack

Start LocalStack with `lstk`:

```bash
lstk start --type aws --persist
```

Check that the emulator is running:

```bash
lstk status
```

Use dummy AWS credentials when targeting LocalStack:

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=eu-west-2
```

## Validate And Build

Run the unit tests:

```bash
./gradlew test
```

Validate the SAM template:

```bash
sam validate --region eu-west-2
```

Build the SAM app:

```bash
sam build
```

The SAM build uses `BuildMethod: makefile`, and the Makefile delegates packaging to Gradle.

## Invoke Without Deploying

You can invoke the function directly with SAM:

```bash
sam local invoke HelloWorldFunction --event events/hello.json
```

Expected response:

```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json"
  },
  "body": "{\"message\":\"hello world\"}"
}
```

This runs the Lambda locally through SAM. It does not deploy API Gateway or anything else to LocalStack.

## Deploy To LocalStack

Deploy the SAM stack to LocalStack:

```bash
lstk sam deploy \
  --stack-name learning-localstack-dev \
  --region eu-west-2 \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset
```

Use `lstk sam` for LocalStack deployments. Without `lstk`, standard `sam deploy` targets real AWS credentials and endpoints.

## Open The REST API

Use the LocalStack API Gateway URL for the deployed route:

```bash
API_ID=$(lstk aws cloudformation describe-stacks \
  --stack-name learning-localstack-dev \
  --region eu-west-2 \
  --query "Stacks[0].Outputs[?OutputKey=='HelloWorldApiId'].OutputValue" \
  --output text)

API_URL="http://localhost:4566/_aws/execute-api/${API_ID}/local/hello"

curl "$API_URL"
```

Expected response:

```json
{"message":"hello world"}
```

Open the same URL in Chrome:

```bash
echo "$API_URL"
```

Then paste the printed URL into Chrome.

## Invoke The Deployed LocalStack Lambda Directly

Invoke the deployed function:

```bash
lstk aws lambda invoke \
  --function-name learning-localstack-dev-hello-world \
  --payload fileb://events/hello.json \
  --region eu-west-2 \
  /tmp/hello-response.json
```

Print the response:

```bash
cat /tmp/hello-response.json
```

The SAM template sets the deployed function name to `${stack-name}-hello-world`, so the local stack uses `learning-localstack-dev-hello-world`.

## Inspect LocalStack Resources

List CloudFormation stacks:

```bash
lstk aws cloudformation list-stacks \
  --region eu-west-2
```

Describe the local stack:

```bash
lstk aws cloudformation describe-stacks \
  --stack-name learning-localstack-dev \
  --region eu-west-2
```

List Lambda functions:

```bash
lstk aws lambda list-functions \
  --region eu-west-2
```

View LocalStack logs:

```bash
lstk logs
```

## Clean Up

Delete the LocalStack CloudFormation stack:

```bash
lstk aws cloudformation delete-stack \
  --stack-name learning-localstack-dev \
  --region eu-west-2
```

Stop LocalStack:

```bash
lstk stop
```

Reset LocalStack state:

```bash
lstk reset
```

## Troubleshooting

If Gradle cannot write to its cache, make sure the current user can write to `~/.gradle`.

If SAM cannot find a region, pass `--region eu-west-2` explicitly or export:

```bash
export AWS_DEFAULT_REGION=eu-west-2
```

If AWS CLI commands fail with credential errors, confirm the dummy credentials are exported in the same shell:

```bash
env | grep AWS_
```

If a command unexpectedly targets real AWS, stop and check whether the command should be using `lstk sam` or `lstk aws`.
