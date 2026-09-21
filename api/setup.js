// One-time (re-runnable) setup endpoint: registers this deployment's
// /api/webhook URL with Spectrum and returns the webhook signing secret.
// Protected by SETUP_TOKEN so randoms can't trigger it.
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (!process.env.SETUP_TOKEN || token !== process.env.SETUP_TOKEN) {
      return new Response("Unauthorized", { status: 401 });
    }

    const projectId = process.env.SPECTRUM_PROJECT_ID;
    const projectSecret = process.env.SPECTRUM_PROJECT_SECRET;
    if (!projectId || !projectSecret) {
      return new Response("Missing SPECTRUM_PROJECT_ID/SECRET", { status: 500 });
    }

    const webhookUrl = `${url.protocol}//${url.host}/api/webhook`;
    const auth = Buffer.from(`${projectId}:${projectSecret}`).toString("base64");

    const res = await fetch(`https://spectrum.photon.codes/projects/${projectId}/webhooks/`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ webhookUrl }),
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  },
};
