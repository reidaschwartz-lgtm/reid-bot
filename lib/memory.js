// Naive persistent memory: a single JSON blob, read-modify-written on every
// call. No locking/concurrency control — fine for a low-traffic personal bot,
// not safe for high write concurrency.
import { put, head } from "@vercel/blob";

const PATHNAME = "memory.json";

export async function readMemory() {
  try {
    const info = await head(PATHNAME);
    const res = await fetch(info.url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
      cache: "no-store",
    });
    if (!res.ok) return {};
    return await res.json();
  } catch (err) {
    return {};
  }
}

export async function writeMemory(data) {
  await put(PATHNAME, JSON.stringify(data, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

// Convenience: append a chat turn (naive rolling window, last N turns kept).
export async function appendConversationTurn(role, content, maxTurns = 20) {
  const mem = await readMemory();
  mem.conversation ||= [];
  mem.conversation.push({ role, content, ts: Date.now() });
  mem.conversation = mem.conversation.slice(-maxTurns);
  await writeMemory(mem);
  return mem;
}
