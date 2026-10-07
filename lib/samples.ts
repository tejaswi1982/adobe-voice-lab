import type { Reading } from "./types";

/**
 * Deterministic demo readings. These are written by hand so the prototype
 * works fully without a model. The first one is the worked example.
 */
export interface Sample {
  copy: string;
  reading: Omit<Reading, "source">;
}

export const EXAMPLE_COPY =
  "Unlock your creativity with powerful tools that help you bring your ideas to life.";

export const SAMPLES: Sample[] = [
  {
    copy: EXAMPLE_COPY,
    reading: {
      working: ["Clear benefit", "Easy to understand", "Positive tone"],
      inTheWay: [
        { quote: "Unlock your creativity", note: "is familiar category language." },
        { quote: "Powerful tools", note: "says very little." },
        { note: "The sentence could belong to almost any creative software brand." },
        { note: "There is no tension, surprise or point of view." },
      ],
      voice: {
        rational: "Clear, but generic.",
        human: "Warm enough, but not memorable.",
        focused: "The idea is understandable, but too broad.",
      },
      editorsNote:
        "The copy explains the product category, but it does not yet give the reader a reason to feel anything.",
      routes: {
        a: {
          id: "a",
          title: "Clarify the idea",
          draft: "Make something. Change it. Keep going.",
          why: "Swaps the abstract promise for three plain actions. The reader sees themselves doing the work, not being sold a capability.",
        },
        b: {
          id: "b",
          title: "Push the idea",
          draft: "The first idea doesn’t have to be the final one.",
          why: "Takes a position on how creative work actually feels. It gives permission instead of making a claim.",
        },
      },
    },
  },
  {
    copy: "Seamlessly collaborate with your team in real time, from anywhere in the world.",
    reading: {
      working: ["Names a real use", "Short", "Speaks to teams directly"],
      inTheWay: [
        { quote: "Seamlessly", note: "is promised by almost every collaboration tool." },
        { quote: "From anywhere in the world", note: "inflates a simple point." },
        { note: "It describes a feature, not what changes for the team." },
        { note: "There are no people in it, only a process." },
      ],
      voice: {
        rational: "Accurate, but abstract.",
        human: "Polite, but distant.",
        focused: "One idea, padded.",
      },
      editorsNote:
        "It tells me what the product does. It does not tell me what working together feels like when it goes right.",
      routes: {
        a: {
          id: "a",
          title: "Clarify the idea",
          draft: "Work on the same file, at the same time.",
          why: "Drops the adverb and the global promise. Keeps the one fact a reader would repeat to a colleague.",
        },
        b: {
          id: "b",
          title: "Push the idea",
          draft: "Stop emailing final_v7.",
          why: "Names a pain every team recognises. The benefit is implied, which lets the reader arrive at it.",
        },
      },
    },
  },
  {
    copy: "Our innovative solutions empower businesses to achieve more with less.",
    reading: {
      working: ["Points at efficiency", "Confident", "Short"],
      inTheWay: [
        { quote: "Innovative solutions", note: "are placeholders for the real product." },
        { quote: "Empower businesses", note: "keeps the reader at arm’s length." },
        { quote: "Achieve more with less", note: "is a line most brands could sign." },
        { note: "It talks about us, not about them." },
      ],
      voice: {
        rational: "Sounds like a claim. Reads like a placeholder.",
        human: "Corporate. There is no person in it.",
        focused: "Gestures at a benefit without naming it.",
      },
      editorsNote: "Every word is safe, and that is the problem. Name one thing the reader gets back.",
      routes: {
        a: {
          id: "a",
          title: "Clarify the idea",
          draft: "Spend less time on the work you repeat.",
          why: "Replaces the abstract promise with a gain the reader can picture in their own week.",
        },
        b: {
          id: "b",
          title: "Push the idea",
          draft: "Nobody started a business to fill in forms.",
          why: "Takes the reader’s side against the busywork. The product becomes the answer without being named.",
        },
      },
    },
  },
];

const normalise = (text: string) =>
  text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/[.!\s]+$/, "")
    .trim();

export function findSample(copy: string): Sample | undefined {
  const key = normalise(copy);
  return SAMPLES.find((s) => normalise(s.copy) === key);
}
