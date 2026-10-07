import { NextResponse } from "next/server";
import { readLocally } from "@/lib/local-reader";
import { readWithModel } from "@/lib/model-reader";
import { findSample } from "@/lib/samples";
import { MAX_COPY_LENGTH, type Reading } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Order of preference:
 * 1. A hand-written demo reading, if the copy is one of the samples.
 * 2. A model reading, if ANTHROPIC_API_KEY is set on the server.
 * 3. The local rule-based reader.
 */
export async function POST(request: Request) {
  let copy: unknown;
  try {
    ({ copy } = await request.json());
  } catch {
    return NextResponse.json({ error: "Expected JSON with a copy field." }, { status: 400 });
  }

  if (typeof copy !== "string" || !copy.trim()) {
    return NextResponse.json({ error: "Add some copy to read." }, { status: 400 });
  }
  if (copy.length > MAX_COPY_LENGTH) {
    return NextResponse.json({ error: `Keep it under ${MAX_COPY_LENGTH} characters.` }, { status: 400 });
  }

  const sample = findSample(copy);
  const reading: Reading = sample
    ? { source: "demo", ...sample.reading }
    : (await readWithModel(copy.trim())) ?? readLocally(copy);

  return NextResponse.json({ reading });
}
