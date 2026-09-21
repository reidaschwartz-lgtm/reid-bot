# reid-bot — LeBron James iMessage auto-reply agent

Hosted on Vercel. Listens on your Spectrum iMessage line (+1 415 605-5838)
via a webhook and auto-replies to every incoming text in a LeBron James
voice, using OpenRouter's free Gemma model. Nothing to run locally —
it's live 24/7 as long as the Vercel project exists.

## Live

- App: https://reid-bot.vercel.app
- Webhook endpoint: https://reid-bot.vercel.app/api/webhook (registered with Spectrum)
- Vercel project: reid-bot (personal account)

## How it's wired

- `api/webhook.js` — receives Spectrum's webhook POST for every incoming
  text, verifies the signature, generates a reply via OpenRouter
  (`google/gemma-4-31b-it:free`) with a LeBron persona, and sends it back.
  Addresses you as "Reid" or "Goat" on a coded 50/50 split.
- `api/setup.js` — registers `/api/webhook` with Spectrum and returns the
  webhook signing secret. Already run once; re-running it (with the
  SETUP_TOKEN) just re-registers the same URL, harmless.
- Env vars live directly in the Vercel project (OPENROUTER_API_KEY,
  OPENROUTER_MODEL, SPECTRUM_PROJECT_ID, SPECTRUM_PROJECT_SECRET,
  SPECTRUM_WEBHOOK_SECRET, SETUP_TOKEN). `.env` here is just a local copy
  for reference if you ever redeploy from source.

## Changing the persona / behavior

Edit `api/webhook.js` (the `systemPrompt` function), then redeploy —
either by pushing to a connected git repo, or ask Claude to push a new
deployment via the Vercel connector.

## Notes

- Replies to literally anyone who texts that number, no filtering.
- Cold starts: the first message after a quiet period may take a couple
  extra seconds to reply while the function spins up.
