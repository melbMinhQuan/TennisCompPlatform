# UTR integration connection point

UTR calculates ratings. This module only retrieves and maps them; it does not
calculate ratings or overwrite player profiles. Mock and live reads share `UtrRatings`.

## Try the development fixture

Set `UTR_PROVIDER=mock` in `backend/.env`, then run from the repository root:

```sh
npm run build --workspace=backend
node --env-file=backend/.env backend/dist/main.js
curl http://localhost:3000/api/v1/utr/demo-rating
```

Environment variables must be loaded into the Node process. The sample start command
does this explicitly. The endpoint returns `{ data: { source: 'mock', ... } }` and
never reads or writes real player records. Production rejects mock configuration.
The default mode is `disabled`; live failures never fall back to fake ratings.

## Client handoff: connect the real API

1. Obtain approved Engage access, client ID/secret, and a registered callback URL.
   Fill in the reserved `UTR_CLIENT_ID`, `UTR_CLIENT_SECRET`, `UTR_REDIRECT_URI`
   environment settings. These are placeholders for the client's OAuth implementation,
   not a working account connection by themselves.
2. Implement authenticated account linking. Request the Ratings scope, bind a random,
   single-use OAuth state to the logged-in user, validate the callback, and exchange
   the code server-side. Store consent and encrypted tokens against that user's player.
3. Replace `UnconnectedUtrStore` in `utr.module.ts` with an implementation of
   `UtrConnectionStore.getAccessToken(playerId)`. Return only that player's valid token.
   Handle token refresh and atomically persist rotated refresh tokens; revoked or
   missing consent should return null. Never use one player's token for other players.
4. Set `UTR_PROVIDER=engage` and optionally change `UTR_API_BASE_URL` to the approved
   QA base URL (include `/api/v1`). Import `UtrModule` where needed, inject `UtrService`,
   and call `syncUTRRating(authenticatedPlayerId)` from an authenticated handler.
   Enforce ownership there; do not trust an email or player ID supplied by a browser.
5. Render the returned contract and its source. Preserve separate singles/doubles,
   unverified values, estimated ranges, and null values. Apply UTR's branding rules.

The public demo endpoint intentionally does not expose live reads. There is no OAuth
callback UI/route yet: the connection store is the explicit extension point for the
client. The existing dashboard uses demo email lookup, not authenticated ownership.

## Storage

`syncUTRRating` fetches a fresh snapshot; it does not persist ratings. The existing
Prisma `UtrLink` remains untouched. Permanent storage and historical charts require
confirmation of UTR's permitted retention/use. No cache is implemented, so no expired
cached data is served. Add appropriate per-client rate limiting before production use.

Official references:

- https://www.utrsports.net/pages/engage-api-documentation
- https://www.utrsports.net/pages/engage-api-terms-and-conditions
- https://www.utrsports.net/pages/api-brand-guidelines

## Verification

```sh
npm run build --workspace=backend
node --test backend/test/utr.test.cjs
```

Tests use stubbed HTTP responses. A real integration test requires approved credentials
and player consent; no external UTR request is made by the test suite.
