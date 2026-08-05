# Local Development With LocalStack

This is the recommended path for running the application locally. LocalStack emulates the AWS services, while `lstk` points SAM and AWS CLI commands at the local emulator.

## Start LocalStack

Start the AWS service emulator with persisted state:

```bash
lstk start --type aws --persist
lstk status
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
lstk sam deploy \
  --stack-name learning-localstack-dev \
  --region eu-west-2 \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset
```

Use `lstk sam` for LocalStack deployment. A plain `sam deploy` targets AWS credentials and endpoints instead.

## Test The API

Get the API ID created by the stack:

```bash
API_ID=$(lstk aws cloudformation describe-stacks \
  --stack-name learning-localstack-dev \
  --region eu-west-2 \
  --query "Stacks[0].Outputs[?OutputKey=='HelloWorldApiId'].OutputValue" \
  --output text)
```

The LocalStack DNS URL uses the API ID as the hostname:

```bash
HELLO_URL="http://${API_ID}.execute-api.localhost.localstack.cloud:4566/local/hello"
PING_URL="http://${API_ID}.execute-api.localhost.localstack.cloud:4566/local/ping"

curl "$HELLO_URL"
curl "$PING_URL"
```

Expected responses:

```json
{"message":"hello world"}
```

```json
{"message":"pong"}
```

Open either URL in a browser with:

```bash
echo "$HELLO_URL"
echo "$PING_URL"
```

## Invoke The Deployed Lambda Directly

API Gateway is not involved in a direct Lambda invocation:

```bash
lstk aws lambda invoke \
  --function-name learning-localstack-dev-hello-world \
  --payload fileb://events/hello.json \
  --region eu-west-2 \
  /tmp/hello-response.json

cat /tmp/hello-response.json
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
lstk stop
lstk reset
lstk start --type aws --persist
```

`lstk reset` removes every resource stored by LocalStack, not only this application. After restarting, repeat the build and deployment commands above.

## Stop LocalStack

```bash
lstk stop
```
