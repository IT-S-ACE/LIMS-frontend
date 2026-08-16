# Frontend Release and Deployment

Release candidate: `1.0.0-rc.2`

## Required environment

```env
VITE_API_URL=https://api.example.com/api
VITE_APP_LANGUAGE=en
VITE_APP_DIRECTION=ltr
VITE_RELEASE_VERSION=1.0.0-rc.2
```

`VITE_API_URL` must use the production HTTPS API origin. The same frontend origin must be listed in
the backend `CORS_ALLOWED_ORIGINS` value.

## Release checks

```bash
npm ci
```

```bash
npm run check:release
```

The deployable client and server output is generated under `.output`.

## Direction and accessibility regression

Build once with `VITE_APP_DIRECTION=ltr` and perform the official UAT. A separate smoke build with
`VITE_APP_DIRECTION=rtl` verifies that navigation, dialogs, tables, forms, and responsive layout do
not break. Direction support does not translate English content by itself.

Verify keyboard navigation, visible focus, skip-to-content, 200% zoom, and a 360 px viewport before
sign-off.

## Post-deployment smoke test

```bash
npm run smoke -- https://api.example.com/api
```

The command must pass both liveness and readiness checks and print their request IDs.

## Rollback

Retain the previous immutable deployment artifact. If the production smoke test fails, restore the
previous frontend artifact, verify that its configured API URL is unchanged, and repeat the smoke
test. Database rollback decisions belong to the backend deployment owner and must never be inferred
from a frontend failure.
