# PageGuard
Responsive Facebook Page video audit MVP.

## Features in this build
- Manual Meta user access token entry (memory only; not persisted by the UI)
- List Pages returned by `/me/accounts`
- Load first 100 Page videos
- View threshold audit and search
- CSV export
- Per-video deletion confirmation; only known view counts at/below threshold are enabled

## Run locally
`npm install` then `npm run dev` (UI only). For Netlify Functions locally use Netlify CLI: `npx netlify dev`.

## Deploy
Connect this repository to Netlify. Build command: `npm run build`; publish directory: `dist`.

## Meta requirements
Create a Meta app and issue a User Access Token with the Page permissions required by the current Meta Graph API documentation. Typical Page reading/deletion flows may require permissions such as `pages_show_list`, `pages_read_engagement`, `pages_read_user_content`, and `pages_manage_posts`; actual requirements depend on endpoint, app mode, and review. Verify them in Meta's current docs and Graph API Explorer. Meta App Review may be required for other users.

## Security and limitations
- Never commit tokens or paste them into chat.
- This starter does not persist tokens, but the token is sent to your Netlify function over HTTPS for each request.
- Do not use this public deployment for other users until proper authentication, rate limiting, abuse protection, and security review are added.
- Video list currently fetches only the first 100 items; pagination, Reels-specific inventory, duplicate detection, durable audit logs, Android packaging, and automated tests are not yet implemented.
- Deletion is permanent and requires individual confirmation. Test with a non-critical video first.
- Graph API v26.0 is configured as a starting point; verify the currently supported version and fields before production use.
