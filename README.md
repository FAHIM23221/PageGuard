# PageGuard

Facebook Page video audit and safe-cleanup platform, being developed in phases. This repository is not production-ready until the full acceptance and security test suite passes.

## Current baseline
- GitHub ZIP auto-extraction workflow.
- React/Vite responsive dashboard starter.
- Manual token input held in UI memory.
- Netlify Function starter for Page listing, first-page video retrieval, and single-video deletion.
- Basic audit helpers and unit tests.

## Development
```bash
npm install
npm run test
npm run build
```
Use `npx netlify dev` to run the frontend and Netlify Functions locally.

## Security
Never commit or share Meta access tokens. The backend sends credentials in an Authorization header, not a URL. This project is not yet ready for public multi-user use: authentication, rate limiting, comprehensive authorization checks, durable audit history, and an independent security review remain outstanding. Keep deletion disabled until the complete safe-delete workflow is verified.

## Meta API
The Graph API version is centralized in `netlify/functions/meta.ts`. Confirm the current supported version, fields, permissions, Page tasks, and App Review requirements in official Meta documentation before real use. Video inventory currently fetches only the first page; cursor pagination and comprehensive posts/Reels discovery are still pending.
