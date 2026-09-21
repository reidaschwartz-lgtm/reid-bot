# reid-bot — LeBron James iMessage agent + Gmail watch/match/react

Hosted on Vercel: https://reid-bot.vercel.app

## What's in here

- `api/webhook.js` — Spectrum webhook. Every incoming iMessage on
  +1 415 605-5838 gets a LeBron-voiced reply from OpenRouter
  (`google/gemma-4-31b-it:free`), with naive conversation memory
  (`lib/memory.js`, a JSON blob in Vercel Blob storage) so it remembers
  recent exchanges. Addresses you as "Reid" or "Goat" on a coded 50/50 split.
- `api/composio-webhook.js` — WATCH/MATCH/REACT dispatcher for Composio
  trigger events. Currently wired to WATCH new-message events on both Gmail
  accounts (personal + Cornell), MATCH on med-school-application keywords
  (AMCAS, secondary, interview, acceptance, waitlist, ...), REACT by texting
  you a heads-up via the LeBron bot. Never sends email or acts on your
  accounts — notification only.
- `api/composio-setup.js` / `api/setup.js` — one-time (re-runnable) setup
  endpoints that register the Composio and Spectrum webhook subscriptions.
  Both gated by SETUP_TOKEN.
- `api/composio-diag.js` — read-only diagnostic (lists trigger types per
  toolkit). Gated by SETUP_TOKEN.
- `lib/spectrum.js` — shared Spectrum app + `textReid()` helper for
  proactively texting Reid outside of an inbound-message context.
- `lib/memory.js` — naive persistent memory: one JSON blob, read-modify-
  written on every call. No locking — fine for low traffic, not safe under
  concurrent writes.

## Connected accounts (Composio)

user_id: `pg-test-5d1d3e30-13e4-444b-8867-4b0fc1324a55` (shared across all
connections below)

- Gmail (personal, reidaschwartz@gmail.com): `ca_VSm0vOj7kV7A`
- Gmail (Cornell, ras653@cornell.edu): `ca_7_fjWhGLGtbv`
- Google Maps: `ca_qiOyROX3CWPK` — connected, not yet wired to any
  automation (Maps has no push triggers; it's pull-only, ready for an
  on-demand tool call whenever you want one).
- NewsAPI: `ca_mSStmYF0JkFz` — connected, not yet wired to anything.

## Changing the Gmail match rule

Edit `KEYWORDS` in `api/composio-webhook.js`, then redeploy.

## Env vars

All live directly in the Vercel project. `.env` here is a local reference
copy only (gitignored) — keep it that way, don't commit it.
