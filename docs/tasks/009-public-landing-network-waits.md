# 009 - Remove network waits before landing paint

## Finding

Auth middleware awaited Supabase getUser before serving `/`, including the landing. A browser carrying a session can therefore wait for Supabase authentication/refresh before receiving page HTML. Anonymous local measurements were about 0.07 seconds, so they do not prove the user's authenticated request latency. LandingPage and SessionHistoryPanel already load user/history asynchronously and do not gate markup on those results.

The root layout also included an external Font Awesome stylesheet as a normal render-blocking link. Its availability can delay first paint independently of Supabase; a browser timing trace was not captured, so it is recorded as an additional possible bottleneck.

## Change

The public root is excluded from auth middleware. Private cabinet routes still perform server authentication; login/register redirect behavior is preserved. For signed-in visits to the landing, the existing automatic cabinet redirect runs client-side after the page has rendered. Public direct-play links remain public.

Font Awesome uses a non-render-blocking print-media link, switched to all media on load, including cache-before-hydration handling. A noscript fallback is retained. The existing provider/version and local page styling remain unchanged.

## Changed files

- `middleware.ts`: public root no longer waits on remote authentication.
- `src/components/LandingPage.tsx`: asynchronous signed-in home redirect after render.
- `src/components/IconStylesheet.tsx`: non-blocking icon stylesheet.
- `app/layout.tsx`: use IconStylesheet.
- `docs/tasks/009-public-landing-network-waits.md`: this record.

## Validation

Mocked middleware checks passed: root excluded from matcher, anonymous cabinet access redirects to login, authenticated cabinet access proceeds, authenticated login redirects to cabinet, and anonymous register proceeds. `npm run build` passed. Compiled middleware matcher and server-rendered HTML also confirm root exclusion, cabinet matching and print-media icon CSS. Actual browser first-paint improvement is not yet measured.

## Manual checks

1. Refresh `/` while logged out and logged in. The landing should paint before account lookup; signed-in visits should subsequently go to the cabinet.
2. Temporarily use browser network throttling or block the Supabase domain: public landing content should remain visible; private cabinet access must remain guarded.
3. Block the CDN stylesheet: text and buttons should still appear; only icons may be unavailable. Restore networking and verify icons load on normal and cached refreshes.
4. Verify login, register, cabinet, direct play and the landing start button still work.
