# learning-localstack-docs

VitePress documentation for the [learning-localstack](https://github.com/adamcurzon/learning-localstack) AWS SAM and LocalStack project.

The site is organized around getting started, LocalStack development, AWS deployment, architecture, troubleshooting, and an OpenAPI reference generated with `vitepress-openapi`.

## Local development

```bash
npm install
npm run dev
```

The local site is available at `http://localhost:5173/learning-localstack-docs/`.

Build the site for production:

```bash
npm run lint:openapi
npm run build
```

The generated site is written to `docs/.vitepress/dist/`.

The changelog page is generated from `CHANGELOG.md` on the application repository's `main` branch during the Pages workflow. To publish a newly merged application changelog, manually run the **Deploy documentation** workflow from the repository's Actions tab.
