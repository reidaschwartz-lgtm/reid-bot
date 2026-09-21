// One-time (re-runnable) setup: registers this deployment's Composio webhook
// URL and creates a WATCH trigger (new Gmail message) on each Gmail account.
// Protected by SETUP_TOKEN.
import { Composio } from "@composio/core";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (!process.env.SETUP_TOKEN || token !== process.env.SETUP_TOKEN) {
      return new Response("Unauthorized", { status: 401 });
    }

    const composio = new Composio();
    const webhookUrl = `${url.protocol}//${url.host}/api/composio-webhook`;
    const subscription = await composio.triggers.setWebhookSubscription({ webhookUrl });

    const userId = process.env.COMPOSIO_USER_ID;
    const targets = {
      gmailCornell: process.env.GMAIL_CORNELL_ACCOUNT_ID,
      gmailPersonal: process.env.GMAIL_PERSONAL_ACCOUNT_ID,
    };

    const results = {};
    for (const [label, connectedAccountId] of Object.entries(targets)) {
      try {
        const trigger = await composio.triggers.create(userId, "GMAIL_NEW_GMAIL_MESSAGE", {
          connectedAccountId,
        });
        results[label] = trigger;
      } catch (err) {
        results[label] = { error: String(err?.message ?? err) };
      }
    }

    return new Response(JSON.stringify({ webhookSecret: subscription.secret, results }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
