// WATCH → MATCH → REACT dispatcher for Composio trigger events.
// WATCH: Composio POSTs here whenever a watched event fires (new Gmail message).
// MATCH: cheap keyword rule against the event payload.
// REACT: text Reid via the LeBron iMessage bot. Non-destructive — never sends
// email or takes any action on his accounts, only notifies him.
import { Composio } from "@composio/core";
import { readMemory, writeMemory } from "../lib/memory.js";
import { textReid } from "../lib/spectrum.js";

const composio = new Composio();

// Default MATCH rule: things time-sensitive for an active med-school
// applicant. Easy to widen/narrow — edit KEYWORDS or replace matches().
const KEYWORDS = [
  "amcas", "secondary application", "secondary essay", "interview invit",
  "interview offer", "admissions committee", "acceptance", "waitlist",
  "match day", "medical school",
];

function matches(eventPayload) {
  const text = JSON.stringify(eventPayload ?? {}).toLowerCase();
  return KEYWORDS.some((k) => text.includes(k));
}

function summarize(eventPayload) {
  const p = eventPayload || {};
  return p.subject || p.snippet || p.messageText || JSON.stringify(p).slice(0, 200);
}

export default {
  async fetch(request) {
    let result;
    try {
      result = await composio.triggers.parse(request, {
        verifySecret: process.env.COMPOSIO_WEBHOOK_SECRET,
      });
    } catch (err) {
      console.error("composio webhook verify failed:", err);
      return new Response("invalid signature", { status: 401 });
    }

    if (result.rawPayload?.type !== "composio.trigger.message") {
      return Response.json({ status: "ignored" });
    }

    const event = result.payload;
    const eventId = result.rawPayload.id;

    const mem = await readMemory();
    mem.processedEventIds ||= [];
    if (mem.processedEventIds.includes(eventId)) {
      return Response.json({ status: "duplicate" });
    }
    mem.processedEventIds.push(eventId);
    mem.processedEventIds = mem.processedEventIds.slice(-300);
    await writeMemory(mem);

    if (event.triggerSlug === "GMAIL_NEW_GMAIL_MESSAGE" && matches(event.payload)) {
      const which = event.metadata?.connectedAccount?.id === process.env.GMAIL_CORNELL_ACCOUNT_ID
        ? "your Cornell email"
        : "your Gmail";
      try {
        await textReid(`Yo Reid, something just landed in ${which} that looks med-school related: "${summarize(event.payload)}". Might wanna check that.`);
      } catch (err) {
        console.error("failed to text Reid:", err);
      }
    }

    return Response.json({ status: "ok" });
  },
};
