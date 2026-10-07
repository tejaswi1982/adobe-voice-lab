import type { Issue, Reading } from "./types";

/**
 * A small rule-based reader for copy that isn't one of the samples.
 * It can spot familiar category language and structural problems, and it can
 * name a direction. It does not write lines: that needs a model, or the writer.
 */

const CATEGORY_LANGUAGE: { pattern: RegExp; note: string }[] = [
  { pattern: /\bunlock(?:s|ing)?(?:\s+(?:your|the|new)\s+\w+)?/i, note: "is familiar category language." },
  { pattern: /\bbring(?:s|ing)?\s+(?:your\s+)?ideas?\s+to\s+life\b/i, note: "is a stock phrase in creative software." },
  { pattern: /\bpowerful(?:\s+(?!and\b|to\b|that\b)\w+)?/i, note: "says very little." },
  { pattern: /\bseamless(?:ly)?\b/i, note: "is promised by almost everyone in the category." },
  { pattern: /\bempower(?:s|ing)?(?:\s+\w+)?/i, note: "asks the reader to supply the feeling." },
  { pattern: /\binnovative(?:\s+\w+)?/i, note: "is a claim, not a description." },
  { pattern: /\b(?:cutting[- ]edge|state[- ]of[- ]the[- ]art)\b/i, note: "dates the copy rather than defining it." },
  { pattern: /\bnext[- ]level\b/i, note: "stands in for a benefit that isn’t named." },
  { pattern: /\b(?:game[- ]chang\w*|revolution\w*)\b/i, note: "overclaims without proof." },
  { pattern: /\b(?:world[- ]class|best[- ]in[- ]class|industry[- ]leading)\b/i, note: "is a ranking without a referee." },
  { pattern: /\beffortless(?:ly)?\b/i, note: "promises no work, which few readers believe." },
  { pattern: /\b(?:supercharg\w*|elevat\w*|transform\w*|unleash\w*)\b/i, note: "is energy without information." },
  { pattern: /\bsolutions?\b/i, note: "hides what the product actually is." },
  { pattern: /\b(?:leverag\w*|harness\w*|streamlin\w*)\b/i, note: "is process language, not reader language." },
  { pattern: /\b(?:robust|intuitive|dynamic)\b/i, note: "is an adjective the reader can’t check." },
  { pattern: /\ball[- ]in[- ]one\b/i, note: "is a feature list in disguise." },
  { pattern: /\b(?:endless|limitless)\s+(?:possibilities|potential)\b/i, note: "is so open it says nothing." },
  { pattern: /\blike never before\b/i, note: "promises a comparison it never makes." },
  { pattern: /\b(?:amazing|incredible|stunning|awesome)\b/i, note: "tells the reader how to feel instead of showing them." },
];

const TENSION = /\b(?:not|never|no|don['’]t|doesn['’]t|can['’]t|won['’]t|stop|without|instead|but|yet|until)\b|\?/i;
const BENEFIT = /\b(?:help|helps|make|makes|create|creates|build|builds|save|saves|find|share|get|start|work|design|edit|write|keep)\b/i;
const READER = /\byou(?:r|rs|['’]re|['’]ll)?\b/i;

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function listQuotes(quotes: string[]) {
  const q = quotes.map((x) => `“${x.toLowerCase()}”`);
  if (q.length <= 1) return q.join("");
  return `${q.slice(0, -1).join(", ")} and ${q[q.length - 1]}`;
}

function findCategoryLanguage(copy: string): Issue[] {
  const hits: { start: number; end: number; issue: Issue }[] = [];
  for (const { pattern, note } of CATEGORY_LANGUAGE) {
    const m = pattern.exec(copy);
    if (!m) continue;
    const start = m.index;
    const end = start + m[0].length;
    if (hits.some((h) => start < h.end && end > h.start)) continue;
    hits.push({ start, end, issue: { quote: capitalise(m[0].trim()), note } });
  }
  return hits.sort((a, b) => a.start - b.start).map((h) => h.issue);
}

export function readLocally(input: string): Reading {
  const copy = input.trim();
  const words = copy.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = copy.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim()).length || 1;
  const conjunctions = (copy.match(/\band\b|,/gi) ?? []).length;

  const hits = findCategoryLanguage(copy);
  const hasTension = TENSION.test(copy);
  const hasReader = READER.test(copy);
  const isLong = wordCount > 25;
  const isCrowded = sentences > 3 || conjunctions >= 4;

  const working: string[] = [];
  if (BENEFIT.test(copy)) working.push("Clear benefit");
  if (wordCount <= 22) working.push("Easy to read in one pass");
  if (hasReader) working.push("Speaks to the reader directly");
  if (/\d/.test(copy)) working.push("Includes a concrete detail");
  if (hasTension) working.push("There is some tension to work with");
  else if (working.length < 3) working.push("Positive tone");
  if (working.length === 0) working.push("The intent is readable");

  const inTheWay: Issue[] = hits.slice(0, 3);
  if (isLong) inTheWay.push({ note: `At ${wordCount} words, it asks the reader to hold a lot at once.` });
  if (isCrowded) inTheWay.push({ note: "Several ideas compete for the lead." });
  if (hits.length >= 2) inTheWay.push({ note: "It could belong to almost any brand in the category." });
  if (!hasTension) inTheWay.push({ note: "There is no tension, surprise or point of view." });
  if (inTheWay.length === 0) {
    inTheWay.push({ note: "Nothing obvious. The question is whether it is distinctive enough to remember." });
  }

  const voice = {
    rational:
      hits.length >= 2
        ? "Clear, but generic."
        : isLong
          ? "The point is there, but it takes work to find."
          : hits.length === 1
            ? "Mostly clear. One phrase is doing no work."
            : "Clear and grounded.",
    human: !hasReader
      ? "Talks about the product more than the reader."
      : hits.length >= 1
        ? "Warm enough, but not memorable."
        : "Natural and direct.",
    focused: isCrowded
      ? "Several ideas at once. Pick one."
      : hits.length >= 2
        ? "The idea is understandable, but too broad."
        : "One idea, held clearly.",
  };

  const editorsNote =
    hits.length >= 2 && !hasTension
      ? "The copy explains the category, but it does not yet give the reader a reason to feel anything."
      : isLong
        ? "There is a good line in here. It is buried under the ones around it."
        : !hasReader
          ? "It describes the product well. Now find the person reading it."
          : !hasTension
            ? "It is clear and it is safe. The next draft could risk a point of view."
            : "This is close. Read it aloud and cut anything you wouldn’t say to a person.";

  const quoted = hits.slice(0, 3).map((h) => h.quote ?? "");

  return {
    source: "local",
    working: working.slice(0, 3),
    inTheWay: inTheWay.slice(0, 4),
    voice,
    editorsNote,
    routes: {
      a: {
        id: "a",
        title: "Clarify the idea",
        draft: null,
        why: quoted.length
          ? `Cut ${listQuotes(quoted)}. Say what the reader actually does or gets, in plain words.`
          : "Say the same thing in fewer words. Keep the one detail a reader would repeat.",
      },
      b: {
        id: "b",
        title: "Push the idea",
        draft: null,
        why: hasTension
          ? "Lean on the contrast you already have. Make it the first thing the reader meets."
          : "Take a position the category avoids. Say the thing a competitor wouldn’t.",
      },
    },
  };
}
