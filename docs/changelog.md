# Changelog

This page mirrors the application changelog from the [learning-localstack repository](https://github.com/adamcurzon/learning-localstack). The documentation site itself is not versioned independently.

The application follows [Semantic Versioning](https://semver.org/):

- `MAJOR` for breaking changes.
- `MINOR` for backward-compatible features.
- `PATCH` for backward-compatible fixes.

## [1.0.0] - 2026-08-05

### Added

- Java 21 AWS Lambda built with Gradle.
- AWS SAM infrastructure definition.
- API Gateway `GET /hello` route.
- API Gateway `GET /ping` route.
- LocalStack testing through `lstk`.
- GitHub Actions AWS deployment using OIDC.
- AWS deployment configured for `eu-west-2`.
