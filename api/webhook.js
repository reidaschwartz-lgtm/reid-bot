import { waitUntil } from "@vercel/functions";
import { getSpectrumApp } from "../lib/spectrum.js";
import { readMemory, appendConversationTurn } from "../lib/memory.js";

function systemPrompt(addressName) {
  return `You are texting as LeBron James — "The King," 4x NBA champion, Akron/Ohio roots, now with the Lakers. You are texting with your friend Reid.

Voice:
- Confident, warm, big-brother energy. Motivational without being cheesy.
- Casual text style: short, 1-3 sentences, no markdown, no emoji spam (an occasional 👑 is fine, not every message).
- Drop in real LeBron touchpoints naturally when relevant: Akron/Ohio, "Striving for Greatness," the Lakers, Savannah and the kids (Bronny, Bryce, Zhuri), business ventures (SpringHill, Uninterrupted, Mtn Dew 24/24), the "not bad for a kid from Akron" humility, competitiveness, love of reading/education (the I PROMISE School).
- Address Reid as "${addressName}" at least once in the reply.
- Never break character, never mention you are an AI, a bot, or a language model.
- You have a running memory of this conversation — use it naturally, don't re-introduce yourself every time.
- Keep it a text message, not an essay — reply the way you'd actually text a friend.`;
}

async function generateReply(userText) {
  const addressName = Math.random() < 0.5 ? "Goat" : "Reid";
  const mem = await readMemory();
  const history = (mem.conversation || []).slice(-12).map(t => ({ role: t.role, content: t.content }));

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free",
      messages: [
        { role: "system", content: systemPrompt(addressName) },
        ...history,
        { role: "user", content: userText },
      ],
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status} ${res.statusText}: ${body}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error(`No reply content in OpenRouter response: ${JSON.stringify(data)}`);
  return reply;
}

async function handleMessage(space, message) {
  if (message.content.type !== "text") return;
  console.log(`[in] ${message.sender?.id ?? "unknown"}: ${message.content.text}`);
  try {
    const reply = await generateReply(message.content.text);
    console.log(`[out] ${reply}`);
    await space.send(reply);
    await appendConversationTurn("user", message.content.text);
    await appendConversationTurn("assistant", reply);
  } catch (err) {
    console.error("handleMessage failed:", err);
    try {
      await space.send("My bad, having some connection issues over here. Give me a sec.");
    } catch (sendErr) {
      console.error("fallback send failed:", sendErr);
    }
  }
}

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("ok", { status: 200 });
    }

    try {
      const app = await getSpectrumApp();

      let resolveDone;
      const done = new Promise((resolve) => {
        resolveDone = resolve;
      });

      const response = await app.webhook(request, async (space, message) => {
        try {
          await handleMessage(space, message);
        } finally {
          resolveDone();
        }
      });

      waitUntil(done);
      return response;
    } catch (err) {
      console.error("webhook fetch failed:", err);
      return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
