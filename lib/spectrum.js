import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";

let appPromise;
export function getSpectrumApp() {
  if (!appPromise) {
    appPromise = Spectrum({
      projectId: process.env.SPECTRUM_PROJECT_ID,
      projectSecret: process.env.SPECTRUM_PROJECT_SECRET,
      providers: [imessage.config()],
      webhookSecret: process.env.SPECTRUM_WEBHOOK_SECRET,
    });
  }
  return appPromise;
}

// Proactively text Reid's own number (not a reply to an inbound message).
export async function textReid(message) {
  const app = await getSpectrumApp();
  const im = imessage(app);
  const reid = await im.user(process.env.REID_PHONE_NUMBER);
  const dm = await im.space.create(reid);
  await dm.send(message);
}
