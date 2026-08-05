# learning-localstack-docs

VitePress documentation for the [learning-localstack](https://github.com/adamcurzon/learning-localstack) AWS SAM and LocalStack project.

The site publishes the existing Markdown guides and an OpenAPI reference generated with `vitepress-openapi`.

## Local development

```bash
npm install
npm run dev
```

Build the site for production:

```bash
npm run lint:openapi
npm run build
```

The generated site is written to `docs/.vitepress/dist/`.
