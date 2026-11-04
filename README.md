# CVForkt - Professional Resume & CV Generator

ATS-compliant resume and CV builder with a live preview, multi-template styling,
drag-and-drop section arrangement, LinkedIn import, cloud sync, ATS auditing, and
PDF/DOCX export.

The live preview fills any blank editor fields with the same example values used
by the editor placeholders, so new users immediately see what a completed resume
will look like. Placeholder content is never silently included in exports: the
DOCX export asks for confirmation before exporting an empty resume, and the
placeholder badge is always visible in the preview.

## Requirements

- Node.js 22.12+
- npm

## Local development

```bash
npm ci
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:3000`.

## Production build

```bash
npm ci
npm run build
npm run start:prod
```

`npm run build` creates the Vite frontend in `dist/` and bundles the production
Express server into `server.js`. The health endpoint is `GET /api/health`.

## Production checklist

- Set `PORT` for the target environment.
- Mount `.data` on persistent storage. Cloud-sync writes are atomic, and an
  unreadable data file is preserved as `<name>.corrupt-<timestamp>` instead of
  being overwritten.
- Terminate TLS at a reverse proxy. With `NODE_ENV=production` the server sends
  security headers, static assets are cached immutably, and API responses are
  marked `no-store`.
- The API has per-IP rate limiting built in (generous ceiling on all endpoints,
  tighter limits on the sync-load endpoints to slow sync-code guessing). If you
  terminate at a proxy on another host, the proxy's address is what gets limited;
  loopback and private-range peers are trusted to pass the real client IP.
- Point the platform health check at `GET /api/health` and send `SIGTERM` on
  deploy; the server shuts down gracefully.
- Run `npm run lint`, `npm test`, `npm run build`, and the CI smoke test before
  release.
- Cloud sync is **opt-in**: nothing leaves the browser until the user enables
  it in the sync panel (or loads a shared resume via a sync code). Sync records
  are stored as plain JSON under `.data/`, so treat that volume as sensitive and
  never mount it into images or CI artifacts.
- Every exported document embeds a small "Engineered by Kitso Motlashuping"
  attribution footer by default. Users can turn it off per document under
  Style Studio → "Include 'Engineered by' footer".

## Testing

```bash
npm test
```

Vitest covers the security- and data-integrity-critical paths: URL sanitizing
(`src/utils/safeUrl.ts`), the resume schema normalizer used for restores and
cloud loads (`src/utils/resumeSchema.ts`), the ATS auditor, and sync-code
generation. `npm run lint` runs `tsc --noEmit` with `strict` mode enabled.

## Docker

```bash
docker build -t cv-generator .
docker run --rm -p 3000:3000 --env-file .env -v cv_data:/app/.data cv-generator
```

Or with Compose:

```bash
docker compose up --build -d
```

The `.data` directory stores cloud-sync records. In containers it is mounted as
the `cv_data` volume so sync data survives restarts.

## CI/CD pipeline

The workflow at `.github/workflows/ci-cd.yml` runs on pull requests, pushes to
`main`, `v*` tags, and manual dispatches.

1. **Quality gate** - installs dependencies with `npm ci`, runs the TypeScript
   check (`npm run lint` with `strict` mode), runs the Vitest suite
   (`npm test`), builds the app and server bundle, smoke-tests
   `/api/health` against the production server, and uploads the build artifact.
2. **Container** - builds the Docker image and pushes it to GitHub Container
   Registry as `ghcr.io/<owner>/<repo>`. Pull requests build the image without
   pushing.
3. **Deploy** - after the quality and container jobs pass on `main` or a `v*`
   tag, calls the configured deployment webhook.

### Repository configuration

| Name | Type | Required | Purpose |
| --- | --- | --- | --- |
| `DEPLOY_WEBHOOK_URL` | Secret | No | Deployment hook (Render, Coolify, Railway, or a custom endpoint that runs `docker compose pull && docker compose up -d`). Deployment is skipped when unset. |
| `PRODUCTION_URL` | Variable | No | Public URL shown on the GitHub production environment. |

`GITHUB_TOKEN` is used to publish to GHCR and already has the required
`packages: write` permission. If the published package is private, the target
host must run `docker login ghcr.io` before pulling the image.

Images are tagged with `latest`, the branch name, the commit SHA, and semver
tags for `v*` releases.
