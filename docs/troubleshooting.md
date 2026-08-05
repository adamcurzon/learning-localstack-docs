# Troubleshooting

## LocalStack Is Not Running

Check Docker and LocalStack:

```bash
docker --version
lstk status
```

Start it when necessary:

```bash
lstk start --type aws --persist
```

## Credentials Or Region Errors

LocalStack commands need dummy credentials and the project region:

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=eu-west-2
```

Use `lstk sam` and `lstk aws` for LocalStack. Use plain `sam` and `aws` for real AWS.

## The Ping Route Is Missing

The route only exists after the updated SAM template has been deployed. Rebuild and deploy:

```bash
sam build
lstk sam deploy \
  --stack-name learning-localstack-dev \
  --region eu-west-2 \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset
```

Retrieve the current API ID rather than reusing an old one:

```bash
lstk aws cloudformation describe-stacks \
  --stack-name learning-localstack-dev \
  --region eu-west-2 \
  --query "Stacks[0].Outputs[?OutputKey=='HelloWorldApiId'].OutputValue" \
  --output text
```

## LocalStack DNS URL Does Not Work

The expected URL format is:

```text
http://<api-id>.execute-api.localhost.localstack.cloud:4566/local/ping
```

Check that the hostname resolves and that port `4566` is reachable:

```bash
dig +short <api-id>.execute-api.localhost.localstack.cloud
curl -i "http://<api-id>.execute-api.localhost.localstack.cloud:4566/local/ping"
```

## Stage Already Exists During Deployment

If CloudFormation reports:

```text
ConflictException: Stage already exists
```

LocalStack's CloudFormation state and API Gateway state may be out of sync after a failed rollback. For a complete local reset:

```bash
lstk stop
lstk reset
lstk start --type aws --persist
```

Then redeploy the stack. This removes all LocalStack resources, not only this application.

## Deployment Rolled Back

Inspect the failure reason:

```bash
lstk aws cloudformation describe-stack-events \
  --stack-name learning-localstack-dev \
  --region eu-west-2 \
  --query "StackEvents[?ResourceStatus=='UPDATE_FAILED' || ResourceStatus=='CREATE_FAILED'].[LogicalResourceId,ResourceStatusReason]" \
  --output table
```

Also inspect LocalStack logs:

```bash
lstk logs
```

## GitHub Actions Cannot Assume AWS Role

Check that:

- The workflow has `id-token: write` permission.
- `AWS_DEPLOY_ROLE_ARN` is configured.
- The IAM trust policy matches the repository and `main` branch.
- The GitHub OIDC provider uses `token.actions.githubusercontent.com`.

The workflow deploys only after tests and `sam build` succeed.
