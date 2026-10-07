import type { Issue, Reading } from "./types";

/**
 * Optional model-backed reader. Server only: imported by the API route,
 * never by client components. Enabled when ANTHROPIC_API_KEY is set.
 */

const SYSTEM_PROMPT = `You are an editorial reader sitting beside a senior copywriter. You read, diagnose and recommend. You never decide. The writer owns the final copy.

Read the copy against three public voice principles:
RATIONAL: clear, useful, grounded.
HUMAN: natural, empathetic, never robotic.
FOCUSED: one idea at a time, remove what does not help.

Then offer exactly two directions:
Route A, "Clarify the idea": simpler, sharper, more specific.
Route B, "Push the idea": a stronger creative position.

Rules:
- Sound like a generous, experienced editor. Short sentences. No jargon. Never superior.
- Quote phrases exactly as they appear in the copy.
- Do not invent product facts, numbers or claims.
- Each route draft is one finished line, under 14 words. No placeholders or brackets.
- Never use em dashes or en dashes.
- Never use: unlock, supercharge, elevate, transform, revolutionise, magic, seamless.

Return only JSON, no prose, in this exact shape:
{
  "working": [string, up to 3, each under 6 words],
  "inTheWay": [{ "quote": optional exact phrase from the copy, "note": string }, up to 4],
  "voice": { "rational": string, "human": string, "focused": string },
  "editorsNote": string, one or two sentences,
  "routes": {
    "a": { "draft": string, "why": string, two short sentences },
    "b": { "draft": string, "why": string, two short sentences }
  }
}`;

const clean = (value: unknown, max = 240): string => {
  if (typeof value !== "string") return "";
  return value
    .replace(/\s*[\u2013\u2014]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
};

function parseReading(raw: string): Reading | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  let data: any;
  try {
    data = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }

  const working = Array.isArray(data?.working) ? data.working.map((w: unknown) => clean(w, 60)).filter(Boolean) : [];
  const inTheWay: Issue[] = Array.isArray(data?.inTheWay)
    ? data.inTheWay
        .map((i: any) => ({ quote: clean(i?.quote, 80) || undefined, note: clean(i?.note) }))
        .filter((i: Issue) => i.note)
    : [];
  const voice = {
    rational: clean(data?.voice?.rational),
    human: clean(data?.voice?.human),
    focused: clean(data?.voice?.focused),
  };
  const editorsNote = clean(data?.editorsNote, 320);
  const a = { draft: clean(data?.routes?.a?.draft, 140), why: clean(data?.routes?.a?.why, 280) };
  const b = { draft: clean(data?.routes?.b?.draft, 140), why: clean(data?.routes?.b?.why, 280) };

  const complete =
    working.length && inTheWay.length && voice.rational && voice.human && voice.focused &&
    editorsNote && a.draft && a.why && b.draft && b.why;
  if (!complete) return null;

  return {
    source: "model",
    working: working.slice(0, 3),
    inTheWay: inTheWay.slice(0, 4),
    voice,
    editorsNote,
    routes: {
      a: { id: "a", title: "Clarify the idea", ...a },
      b: { id: "b", title: "Push the idea", ...b },
    },
  };
}

export const modelEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

export async function readWithModel(copy: string): Promise<Reading | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  // One retry: occasional empty or malformed replies are usually transient.
  return (await requestOnce(copy)) ?? (await requestOnce(copy));
}

async function requestOnce(copy: string): Promise<Reading | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `<copy>
${copy}
</copy>` }],
      }),
    });
    if (!res.ok) {
      console.error(`Model read failed: HTTP ${res.status}`);
      return null;
    }
    const body = await res.json();
    const text = Array.isArray(body?.content)
      ? body.content.map((block: any) => (block?.type === "text" ? block.text : "")).join("")
      : "";
    const reading = parseReading(text);
    if (!reading) console.error(`Model read unusable (stop_reason: ${body?.stop_reason ?? "unknown"})`);
    return reading;
  } catch (err) {
    console.error("Model read failed:", err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
