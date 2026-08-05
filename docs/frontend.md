# Deploying the React frontend

The React frontend is maintained in the private [learning-localstack-frontend repository](https://github.com/adamcurzon/learning-localstack-frontend). The main application repository includes it as the `/frontend` Git submodule.

The frontend uses React, TypeScript, Vite, and Material UI. It calls the API root route and displays the response in a modal:

```json
{"message":"learning-localstack-api"}
```

## Run locally

From the main application repository, initialize the frontend submodule if necessary:

```bash
git submodule update --init --recursive
```

Start LocalStack, deploy the backend, resolve the API ID, and run the frontend with one command:

```bash
./scripts/localstack-dev
```

The frontend is served at:

```text
http://127.0.0.1:5173/
```

The script passes a LocalStack API URL like this to Vite:

```text
http://<api-id>.execute-api.localhost.localstack.cloud:4566/local
```

If the LocalStack hostname does not resolve, configure the local DNS mapping before opening the frontend in a browser. The API can be checked directly with the LocalStack hostname and `curl --resolve`.

## Deploy to Amplify

The frontend repository contains a SAM-compatible `template.yaml` that provisions:

- An `AWS::Amplify::App` connected to the private frontend repository.
- A production `main` branch.
- The `VITE_API_BASE_URL` branch environment variable.
- The Amplify default domain and frontend origin as stack outputs.

The frontend repository workflow is:

```text
.github/workflows/deploy-amplify.yml
```

It runs on pushes to `main` and can also be started manually. The workflow:

1. Assumes the frontend AWS deployment role using GitHub OIDC.
2. Reads `HelloWorldApiId` from the `learning-localstack-dev` backend stack.
3. Builds the AWS API Gateway base URL in `eu-west-2`.
4. Deploys or updates the Amplify CloudFormation stack.
5. Starts an explicit Amplify `RELEASE` job for the `main` branch.

Amplify branch auto-builds are disabled so GitHub Actions is the single deployment trigger.

## Required frontend secrets

Add these encrypted secrets to the frontend repository under **Settings -> Secrets and variables -> Actions**:

```text
AWS_FRONTEND_DEPLOY_ROLE_ARN
AMPLIFY_GITHUB_ACCESS_TOKEN
```

The AWS role must trust the frontend repository's `main` branch through GitHub OIDC. The Amplify token allows Amplify to read the private repository.

## Configure production CORS

After the first frontend deployment, retrieve the `FrontendOrigin` output from the `learning-localstack-frontend` CloudFormation stack. It will look like:

```text
https://main.<amplify-app-id>.amplifyapp.com
```

Add that value as the `FRONTEND_ORIGIN` Actions variable in the main `learning-localstack` repository. Do not include `/local` or a trailing slash.

Then rerun the main repository's backend deployment workflow. The backend passes the origin to API Gateway and Lambda, allowing browser requests only from the deployed Amplify frontend.

LocalStack continues to use a wildcard origin for local development only.

## Verify the deployment

Open the Amplify `main` branch URL and select **Check API**. The response modal should show:

```json
{
  "message": "learning-localstack-api"
}
```

To inspect the latest Amplify release job:

```bash
APP_ID=$(aws cloudformation describe-stacks \
  --stack-name learning-localstack-frontend \
  --region eu-west-2 \
  --query "Stacks[0].Outputs[?OutputKey=='AmplifyAppId'].OutputValue" \
  --output text)

aws amplify list-jobs \
  --app-id "$APP_ID" \
  --branch-name main \
  --region eu-west-2 \
  --query "jobSummaries[0].[jobId,status]" \
  --output table
```

The expected successful status is `SUCCEED`.

## Submodule updates

The main repository pins the frontend to a specific commit. After a frontend change is merged, update the parent repository:

```bash
cd frontend
git pull origin main
cd ..
git add frontend
git commit -m "Update frontend submodule"
```

Use `git submodule update --init --recursive` after cloning or switching branches.
