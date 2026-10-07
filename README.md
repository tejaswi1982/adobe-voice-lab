# Adobe Voice Lab

**Speculative prototype. Independent concept.**

An independent speculative prototype, made as part of a job application. It is not an Adobe product and is not affiliated with or endorsed by Adobe.

## Concept

> AI should help a writer make better choices, not simply make more copy.

Most AI writing tools answer a brief with more copy. This prototype works the other way round. It behaves like an editor sitting beside a senior writer: it reads, judges and recommends. The writer decides.

The flow is fixed, and the order is the point:

```
INPUT → READ → JUDGE → EXPLORE → RECOMMEND → HUMAN CHOOSES → HUMAN EDITS / APPROVES → FINAL
```

| Stage | Who | What happens |
| --- | --- | --- |
| 01 Original | Human | The writer pastes a line of copy. |
| 02 The read | AI-assisted | What's working, what's getting in the way, a voice check and an editor's note. No rewriting yet. |
| 03 Two ways forward | AI-assisted | Exactly two directions: **A, Clarify the idea** and **B, Push the idea**. Recommendations, not decisions. |
| 04 Your call | Human | Keep original, Route A, Route B or I'll write it. Nothing is preselected. |
| 05 Human edit | Human | The chosen starting point opens in an editor. The wording now belongs to the writer. |
| 06 Final | Human | The approved copy, set cleanly, followed by the authorship log. |

The **authorship log** records every step and who did it. It also says plainly where the final words came from, for example "The final wording was suggested by AI and approved unchanged by the writer" or "Every word in the final copy was written by the writer".

Provenance is visible throughout: a filled mark means human, an open mark means AI-assisted, and AI-suggested lines are set in slate while the writer's words stay in ink.

### Public voice principles

The read uses three principles drawn from Adobe's publicly shared voice and tone guidance, labelled in the interface as public and paraphrased:

- **Rational.** Clear. Useful. Grounded.
- **Human.** Natural. Empathetic. Never robotic.
- **Focused.** One idea at a time. Remove what does not help.

These are not internal guidelines and the prototype does not claim they are.

## Running locally

Requires Node 20.9 or later.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Production build:

```bash
npm run build
npm start
```

## Demo mode

No API key is needed. Demo mode is the default.

- **Samples.** Three sample lines (the worked example plus two more) have hand-written readings and routes in `lib/samples.ts`. They are deterministic and always identical.
- **Your own copy.** Anything else goes to a small rule-based reader in `lib/local-reader.ts`. It flags familiar category language and structural problems, writes a voice check and an editor's note, and names both directions. It deliberately does **not** write route lines: it says "Direction only" and leaves the writing to the writer. Each read is labelled with its source (demo, local or model).

If the API route is unreachable (for example on a static host), the browser falls back to the same local logic, so the flow never breaks.

## Optional LLM integration

The server route `app/api/read/route.ts` picks a reader in this order:

1. A hand-written sample reading, if the copy matches a sample.
2. A model reading, if `ANTHROPIC_API_KEY` is set on the server.
3. The local rule-based reader.

To enable model reads, copy `.env.example` to `.env.local` and set:

```bash
ANTHROPIC_API_KEY=your-key
ANTHROPIC_MODEL=claude-sonnet-5-5   # optional
```

The key is only read on the server in `lib/model-reader.ts`. It is never sent to the browser and must not be prefixed with `NEXT_PUBLIC_`. The model is asked for strict JSON in the same shape as the demo readings. The response is validated and cleaned (dashes removed, lengths capped). If the call fails, times out or returns something unusable, the route falls back to the local reader.

To use a different provider, replace `readWithModel` in `lib/model-reader.ts`. It only needs to return a `Reading` (see `lib/types.ts`) or `null`.

Before exposing a model-backed deployment publicly, add rate limiting to `/api/read`.

## Project structure

```
app/
  layout.tsx          Fonts (Newsreader, Instrument Sans), metadata
  page.tsx            Masthead, worked example, lab, about
  api/read/route.ts   Server route: sample, model or local read
components/
  Lab.tsx             The six-stage flow and its state
  Authorship.tsx      Authorship log (side panel and full log)
  VoicePanel.tsx      Public voice principles
  Who.tsx             Human / AI-assisted provenance tag
lib/
  samples.ts          Deterministic demo readings
  local-reader.ts     Rule-based reader for any copy
  model-reader.ts     Optional server-only model reader
  types.ts            Shared types
```

No UI libraries. Styling is plain CSS Modules.

## Accessibility

- Semantic sections, headings and landmarks, with a skip link.
- Each stage moves focus to its heading as it opens, and respects reduced motion when scrolling.
- The decision step is a native radio group in a fieldset. Nothing is preselected.
- Errors are announced; status changes in the editor are live.
- Visible focus states throughout. All controls work by keyboard.

## Deployment

**Vercel.** Import the repository. No configuration needed. Add `ANTHROPIC_API_KEY` under Environment Variables only if you want model reads.

**Railway.** Create a service from the repository. Railway runs `npm run build`, then `npm start`, which listens on `$PORT`. Add the optional environment variables in the service settings.

## About

Adobe Voice Lab is an independent speculative prototype exploring how AI might support professional writers without removing authorship, judgment or creative responsibility. Built using publicly available Adobe brand and voice principles. Not affiliated with or endorsed by Adobe.
