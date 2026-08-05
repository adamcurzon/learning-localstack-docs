# React Frontend Plan

## Overview

The React frontend lives in the private repository [learning-localstack-frontend](https://github.com/adamcurzon/learning-localstack-frontend). The main application repository includes that repository as a Git submodule at `/frontend`.

The first version provides a Material UI interface with a `Check API` button. Clicking the button calls the API root route and displays the JSON response in a modal with a close button.

Expected response:

```json
{"message":"learning-localstack-api"}
```

## Local development

Clone the main repository with its submodules:

```bash
git clone --recurse-submodules https://github.com/adamcurzon/learning-localstack.git
cd learning-localstack/frontend
cp .env.example .env.local
npm install
npm run dev
```

Set `VITE_API_BASE_URL` to the LocalStack API base URL. For example:

```text
http://<api-id>.execute-api.localhost.localstack.cloud:4566/local
```

The frontend appends `/` to this value when calling the root route.

## AWS deployment

AWS Amplify Hosting is the planned hosting service. It provides managed static hosting, HTTPS, CDN delivery, GitHub integration, and deployment previews without requiring a web server.

Connect Amplify to the private `learning-localstack-frontend` repository and configure:

- Branch: `main`
- Build command: `npm ci && npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL`

Set the environment variable to the API Gateway URL in `eu-west-2`:

```text
https://<api-id>.execute-api.eu-west-2.amazonaws.com/local
```

The backend continues to deploy through the existing SAM GitHub Actions workflow. Frontend and backend deployments are independent.

## Submodule updates

The parent repository pins the frontend to a specific commit. After a frontend change is merged, update the parent repository with:

```bash
cd frontend
git pull origin main
cd ..
git add frontend
git commit -m "Update frontend submodule"
```

Use `git submodule update --init --recursive` after cloning or switching branches.

## CORS

The SAM API allows `GET`, `OPTIONS`, and the `Content-Type` header. Local development can use the default permissive origin. AWS deployments should pass the Amplify application origin as the `FrontendOrigin` parameter so browser requests are restricted to the deployed frontend.

## Cost

Amplify Hosting is suitable for this low-volume learning application because it is managed static hosting and includes free-tier allowances for eligible usage. Lambda and API Gateway also provide free-tier usage for eligible AWS accounts. Configure an AWS Budget alert and avoid adding a custom domain, WAF, or server-side rendering until there is a specific requirement.

## Growth path

The frontend is organised by app, shared components, features, and configuration. New API capabilities should be added as feature modules with their own API client types and tests. Shared dialogs and layout components remain under `src/components`.
