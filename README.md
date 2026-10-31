# PageGuard — Phase 2 inventory pagination

This update adds cursor-based pagination for the Page Videos edge, stable-ID merging across pages, read-only audit presentation, and local session clearing. It does not claim complete Page video/Reels coverage: the Page Videos edge may not expose every post attachment or Reel.

Apply these files over the repository root using the ZIP extractor. Run:
- `npm install`
- `npm run test`
- `npm run build`

Meta Graph API version and supported edge/fields/permissions must be checked against the current official Meta docs before production. Deletion stays disabled.
