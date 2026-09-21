import { Composio } from "@composio/core";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (!process.env.SETUP_TOKEN || token !== process.env.SETUP_TOKEN) {
      return new Response("Unauthorized", { status: 401 });
    }

    const composio = new Composio();
    const [gmailTypes, mapsTypes, newsTypes] = await Promise.all([
      composio.triggers.listTypes({ toolkits: ["gmail"] }).catch(e => ({ error: String(e) })),
      composio.triggers.listTypes({ toolkits: ["google_maps"] }).catch(e => ({ error: String(e) })),
      composio.triggers.listTypes({ toolkits: ["news_api"] }).catch(e => ({ error: String(e) })),
    ]);

    return new Response(JSON.stringify({ gmailTypes, mapsTypes, newsTypes }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
