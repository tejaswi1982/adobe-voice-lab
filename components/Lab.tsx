"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { readLocally } from "@/lib/local-reader";
import { EXAMPLE_COPY, SAMPLES, findSample } from "@/lib/samples";
import { MAX_COPY_LENGTH, type Choice, type Reading, type RouteId, type Source } from "@/lib/types";
import { Authorship, type AuthorshipRow } from "./Authorship";
import { VoicePanel } from "./VoicePanel";
import { Who } from "./Who";
import styles from "./lab.module.css";

type Stage = "original" | "read" | "routes" | "edit" | "final";
const ORDER: Stage[] = ["original", "read", "routes", "edit", "final"];
const reached = (stage: Stage, at: Stage) => ORDER.indexOf(stage) >= ORDER.indexOf(at);

const STEPS: { n: string; label: string; target: string; at: Stage }[] = [
  { n: "01", label: "Original", target: "h-original", at: "original" },
  { n: "02", label: "The read", target: "h-read", at: "read" },
  { n: "03", label: "Two ways forward", target: "h-routes", at: "routes" },
  { n: "04", label: "Your call", target: "h-call", at: "routes" },
  { n: "05", label: "Human edit", target: "h-edit", at: "edit" },
  { n: "06", label: "Final", target: "h-final", at: "final" },
];

const SAMPLE_NAMES = ["Creative tools", "Collaboration", "Business software"];

const CHOICES: { id: Choice; label: string; hint: string }[] = [
  { id: "original", label: "Keep original", hint: "Work from what you wrote." },
  { id: "a", label: "Route A", hint: "Start from Clarify the idea." },
  { id: "b", label: "Route B", hint: "Start from Push the idea." },
  { id: "own", label: "I’ll write it", hint: "Start from a blank page." },
];
const CHOICE_LABEL = Object.fromEntries(CHOICES.map((c) => [c.id, c.label])) as Record<Choice, string>;

const SOURCE_NOTE: Record<Source, string> = {
  demo: "Demo read. Written in advance for this sample, so it works without a model.",
  local: "Local read. Rule-based, so it names directions but leaves the writing to you.",
  model: "Model read. Generated on the server for this copy.",
};

const SOURCE_DETAIL: Record<Source, string> = {
  demo: "Demo read",
  local: "Rule-based read",
  model: "Model read",
};

async function requestReading(copy: string): Promise<Reading> {
  try {
    const res = await fetch("/api/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ copy }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.reading) return data.reading as Reading;
    }
  } catch {
    // Fall through to the in-browser reader, e.g. on a static host.
  }
  const sample = findSample(copy);
  return sample ? { source: "demo", ...sample.reading } : readLocally(copy);
}

/** Underline the phrases the read flagged, like an editor's pencil. */
function markPhrases(text: string, quotes: string[]): ReactNode {
  const lower = text.toLowerCase().replace(/’/g, "'");
  const ranges: [number, number][] = [];
  for (const q of quotes) {
    const i = lower.indexOf(q.toLowerCase().replace(/’/g, "'"));
    if (i >= 0 && !ranges.some(([s, e]) => i < e && i + q.length > s)) ranges.push([i, i + q.length]);
  }
  if (!ranges.length) return text;
  ranges.sort((a, b) => a[0] - b[0]);
  const out: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([s, e], i) => {
    out.push(text.slice(cursor, s));
    out.push(
      <mark key={i} className={styles.flag}>
        {text.slice(s, e)}
      </mark>,
    );
    cursor = e;
  });
  out.push(text.slice(cursor));
  return out;
}

function useAutoHeight(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return ref;
}

const formatTime = (d: Date) =>
  d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function Lab() {
  const [stage, setStage] = useState<Stage>("original");
  const [copy, setCopy] = useState(EXAMPLE_COPY);
  const [readCopy, setReadCopy] = useState("");
  const [reading, setReading] = useState<Reading | null>(null);
  const [busy, setBusy] = useState(false);
  const [inputError, setInputError] = useState("");

  const [selected, setSelected] = useState<Choice | null>(null);
  const [callError, setCallError] = useState("");
  const [committed, setCommitted] = useState<Choice | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<Choice, string>>>({});
  const [editError, setEditError] = useState("");

  const [approved, setApproved] = useState<{ text: string; at: Date } | null>(null);
  const [copied, setCopied] = useState("");

  const focusNext = useRef<string | null>(null);
  const originalRef = useAutoHeight(copy);
  const draft = committed ? (drafts[committed] ?? "") : "";
  const editRef = useAutoHeight(draft);

  useEffect(() => {
    const id = focusNext.current;
    if (!id) return;
    focusNext.current = null;
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [stage]);

  const go = (next: Stage, focusId: string) => {
    focusNext.current = focusId;
    setStage(next);
  };

  /* Starting text for the edit stage depends on what the writer chose. */
  const startTextFor = (choice: Choice): string => {
    if (choice === "own") return "";
    if (choice === "original") return readCopy;
    return reading?.routes[choice].draft ?? readCopy;
  };

  const fromLabel = (choice: Choice): string => {
    if (choice === "own") return "a blank page";
    if (choice === "original") return "your original";
    const route = reading?.routes[choice];
    return route?.draft ? `Route ${choice.toUpperCase()}` : `your original, following Route ${choice.toUpperCase()}`;
  };

  const resetDownstream = () => {
    setReading(null);
    setSelected(null);
    setCommitted(null);
    setDrafts({});
    setApproved(null);
    setCallError("");
    setEditError("");
    setCopied("");
  };

  async function analyse(event?: React.FormEvent) {
    event?.preventDefault();
    const text = copy.trim();
    if (!text) {
      setInputError("Add some copy to read.");
      originalRef.current?.focus();
      return;
    }
    setInputError("");
    setBusy(true);
    const result = await requestReading(text);
    setBusy(false);
    resetDownstream();
    setReadCopy(text);
    setReading(result);
    go("read", "h-read");
  }

  function changeCopy() {
    resetDownstream();
    setReadCopy("");
    go("original", "original-copy");
  }

  function loadSample(text: string) {
    setCopy(text);
    setInputError("");
    originalRef.current?.focus();
  }

  function commitChoice() {
    if (!selected) {
      setCallError("Choose one to continue. Nothing is selected for you.");
      return;
    }
    setCallError("");
    setCommitted(selected);
    setDrafts((d) => (d[selected] === undefined ? { ...d, [selected]: startTextFor(selected) } : d));
    go("edit", "h-edit");
  }

  function approve() {
    if (!committed || !draft.trim()) {
      setEditError("There is nothing to approve yet.");
      editRef.current?.focus();
      return;
    }
    setEditError("");
    setApproved({ text: draft.trim(), at: new Date() });
    go("final", "h-final");
  }

  async function copyFinal() {
    if (!approved) return;
    try {
      await navigator.clipboard.writeText(approved.text);
      setCopied("Copied to clipboard.");
    } catch {
      setCopied("Couldn’t reach the clipboard. Select the text to copy it.");
    }
  }

  function startOver() {
    resetDownstream();
    setReadCopy("");
    setCopy(readCopy || EXAMPLE_COPY);
    go("original", "h-original");
  }

  /* Authorship */
  const startText = committed ? startTextFor(committed) : "";
  const isUnchanged = committed !== null && draft.trim() === startText.trim();
  const routeDrafted = (id: RouteId) => Boolean(reading?.routes[id].draft);

  const editDetail = (() => {
    if (!committed) return undefined;
    if (!draft.trim()) return "Nothing written yet";
    if (committed === "own") return "Written from scratch";
    return isUnchanged ? `Unchanged from ${fromLabel(committed)}` : `Edited from ${fromLabel(committed)}`;
  })();

  const rows: AuthorshipRow[] = [
    {
      label: "Original copy",
      by: "human",
      done: true,
      detail: readCopy ? (findSample(readCopy) ? "Sample draft" : "Your text") : "In progress",
    },
    { label: "Editorial diagnosis", by: "ai", done: Boolean(reading), detail: reading ? SOURCE_DETAIL[reading.source] : "" },
    {
      label: "Route A",
      by: "ai",
      done: reached(stage, "routes"),
      detail: routeDrafted("a") ? "Suggested a line" : "Named a direction",
    },
    {
      label: "Route B",
      by: "ai",
      done: reached(stage, "routes"),
      detail: routeDrafted("b") ? "Suggested a line" : "Named a direction",
    },
    { label: "Direction selected", by: "human", done: Boolean(committed), detail: committed ? CHOICE_LABEL[committed] : "" },
    { label: "Final edit", by: "human", done: Boolean(approved), detail: editDetail },
    { label: "Final approval", by: "human", done: Boolean(approved), detail: approved ? formatTime(approved.at) : "" },
  ];

  const summary = (() => {
    if (!approved || !committed) return undefined;
    if (committed === "own") return "Every word in the final copy was written by the writer.";
    if (committed === "original") return "The final copy is the writer’s own text, approved after an AI read.";
    if (!routeDrafted(committed)) return "The writer wrote the final copy, following a direction the AI named.";
    return isUnchanged
      ? "The final wording was suggested by AI and approved unchanged by the writer."
      : "The final copy began as an AI suggestion. The writer edited it and approved it.";
  })();

  const currentStep =
    stage === "original" ? "01" : stage === "read" ? "02" : stage === "routes" ? (selected ? "04" : "03") : stage === "edit" ? "05" : "06";

  const locked = stage !== "original";
  const callLocked = reached(stage, "edit");

  return (
    <div className={styles.lab} id="lab">
      <nav className={styles.index} aria-label="Stages">
        <ol>
          {STEPS.map((s) => {
            const isReached = reached(stage, s.at);
            const isCurrent = s.n === currentStep;
            return (
              <li key={s.n} className={`${isReached ? styles.reached : ""} ${isCurrent ? styles.current : ""}`}>
                {isReached ? (
                  <a href={`#${s.target}`} aria-current={isCurrent ? "step" : undefined}>
                    <span className={styles.num}>{s.n}</span> {s.label}
                  </a>
                ) : (
                  <span>
                    <span className={styles.num}>{s.n}</span> {s.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className={styles.grid}>
        <main className={styles.main}>
          {/* 01 ORIGINAL */}
          <section className={styles.stage} aria-labelledby="h-original">
            <header className={styles.stageHead}>
              <h2 id="h-original" tabIndex={-1} className={styles.stageTitle}>
                <span className={styles.num}>01</span> Original copy
              </h2>
              <Who by="human" />
            </header>

            {locked ? (
              <>
                <blockquote className={styles.originalLocked}>
                  <p>{reading ? markPhrases(readCopy, reading.inTheWay.flatMap((i) => (i.quote ? [i.quote] : []))) : readCopy}</p>
                </blockquote>
                <div className={styles.actions}>
                  <button type="button" className={styles.textButton} onClick={changeCopy}>
                    Change copy
                  </button>
                  {reading ? <p className={styles.meta}>Underlined: phrases the read flags.</p> : null}
                </div>
              </>
            ) : (
              <form onSubmit={analyse} noValidate>
                <label htmlFor="original-copy" className={styles.fieldLabel}>
                  Your copy
                </label>
                <textarea
                  id="original-copy"
                  ref={originalRef}
                  className={styles.originalInput}
                  value={copy}
                  maxLength={MAX_COPY_LENGTH}
                  rows={2}
                  spellCheck
                  aria-invalid={inputError ? true : undefined}
                  aria-describedby="original-help original-error"
                  onChange={(e) => {
                    setCopy(e.target.value);
                    if (inputError) setInputError("");
                  }}
                  placeholder="Paste a headline or a line of copy."
                />
                <div className={styles.fieldFoot}>
                  <p id="original-help" className={styles.meta}>
                    Paste your own, or try a sample:{" "}
                    {SAMPLES.map((s, i) => (
                      <span key={s.copy}>
                        <button
                          type="button"
                          className={`${styles.inlineButton} ${copy.trim() === s.copy ? styles.inlineActive : ""}`}
                          onClick={() => loadSample(s.copy)}
                        >
                          {SAMPLE_NAMES[i]}
                        </button>
                        {i < SAMPLES.length - 1 ? ", " : "."}
                      </span>
                    ))}
                  </p>
                  <p className={styles.counter} aria-hidden="true">
                    {copy.length}/{MAX_COPY_LENGTH}
                  </p>
                </div>
                <p id="original-error" className={styles.error} role="alert">
                  {inputError}
                </p>
                <div className={styles.actions}>
                  <button type="submit" className={styles.primary} disabled={busy} aria-busy={busy}>
                    {busy ? "Reading…" : "Analyse"}
                  </button>
                  <p className={styles.meta}>Reads and diagnoses first. Nothing gets rewritten yet.</p>
                </div>
              </form>
            )}
          </section>

          {/* 02 THE READ */}
          {reading && reached(stage, "read") ? (
            <section className={styles.stage} aria-labelledby="h-read">
              <header className={styles.stageHead}>
                <h2 id="h-read" tabIndex={-1} className={styles.stageTitle}>
                  <span className={styles.num}>02</span> The read
                </h2>
                <Who by="ai" />
              </header>
              <p className={styles.source}>{SOURCE_NOTE[reading.source]}</p>

              <div className={styles.readGrid}>
                <div>
                  <h3 className={styles.subTitle}>What&rsquo;s working</h3>
                  <ul className={styles.notes}>
                    {reading.working.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className={styles.subTitle}>What&rsquo;s getting in the way</h3>
                  <ul className={styles.notes}>
                    {reading.inTheWay.map((issue) => (
                      <li key={(issue.quote ?? "") + issue.note}>
                        {issue.quote ? (
                          <>
                            <q className={styles.quoted}>{issue.quote}</q> {issue.note}
                          </>
                        ) : (
                          issue.note
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={styles.voiceCheck}>
                <h3 className={styles.subTitle}>Voice check</h3>
                <dl>
                  {(["rational", "human", "focused"] as const).map((k) => (
                    <div key={k} className={styles.voiceRow}>
                      <dt>{k}</dt>
                      <dd>{reading.voice[k]}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <aside className={styles.editorsNote} aria-labelledby="h-note">
                <h3 id="h-note" className={styles.subTitle}>
                  Editor&rsquo;s note
                </h3>
                <p>{reading.editorsNote}</p>
              </aside>

              {stage === "read" ? (
                <div className={styles.actions}>
                  <button type="button" className={styles.primary} onClick={() => go("routes", "h-routes")}>
                    See two ways forward
                  </button>
                  <p className={styles.meta}>Directions come after the diagnosis, never before.</p>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* 03 TWO WAYS FORWARD */}
          {reading && reached(stage, "routes") ? (
            <section className={styles.stage} aria-labelledby="h-routes">
              <header className={styles.stageHead}>
                <h2 id="h-routes" tabIndex={-1} className={styles.stageTitle}>
                  <span className={styles.num}>03</span> Two ways forward
                </h2>
                <Who by="ai" />
              </header>
              <p className={styles.standfirst}>
                Two directions, not ten. These are recommendations. <strong>The decision is yours.</strong>
              </p>

              <div className={styles.routes}>
                {(["a", "b"] as const).map((id) => {
                  const route = reading.routes[id];
                  return (
                    <article key={id} className={styles.route} aria-labelledby={`route-${id}`}>
                      <p className={styles.routeLabel}>Route {id.toUpperCase()}</p>
                      <h3 id={`route-${id}`} className={styles.routeTitle}>
                        {route.title}
                      </h3>
                      {route.draft ? (
                        <p className={styles.routeDraft}>{route.draft}</p>
                      ) : (
                        <p className={styles.routeDirection}>Direction only</p>
                      )}
                      <p className={styles.routeWhyLabel}>{route.draft ? "Why it could work" : "The direction"}</p>
                      <p className={styles.routeWhy}>{route.why}</p>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* 04 YOUR CALL */}
          {reading && reached(stage, "routes") ? (
            <section className={styles.stage} aria-labelledby="h-call">
              <header className={styles.stageHead}>
                <h2 id="h-call" tabIndex={-1} className={styles.stageTitle}>
                  <span className={styles.num}>04</span> Your call
                </h2>
                <Who by="human" />
              </header>

              <fieldset className={styles.choices} disabled={callLocked} aria-describedby="call-error">
                <legend className={styles.standfirst}>Nothing is selected for you. Which do you want to work from?</legend>
                <div className={styles.choiceGrid}>
                  {CHOICES.map((c) => (
                    <label key={c.id} className={styles.choice}>
                      <input
                        type="radio"
                        name="direction"
                        value={c.id}
                        className={styles.radio}
                        checked={selected === c.id}
                        onChange={() => {
                          setSelected(c.id);
                          setCallError("");
                        }}
                      />
                      <span className={styles.choiceText}>
                        <span className={styles.choiceLabel}>{c.label}</span>
                        <span className={styles.choiceHint}>{c.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <p id="call-error" className={styles.error} role="alert">
                {callError}
              </p>

              {callLocked ? (
                <p className={styles.meta}>
                  You chose <strong>{committed ? CHOICE_LABEL[committed] : ""}</strong>.
                </p>
              ) : (
                <div className={styles.actions}>
                  <button type="button" className={styles.primary} aria-disabled={!selected} onClick={commitChoice}>
                    Continue to edit
                  </button>
                </div>
              )}
            </section>
          ) : null}

          {/* 05 HUMAN EDIT */}
          {committed && reached(stage, "edit") ? (
            <section className={styles.stage} aria-labelledby="h-edit">
              <header className={styles.stageHead}>
                <h2 id="h-edit" tabIndex={-1} className={styles.stageTitle}>
                  <span className={styles.num}>05</span> Human edit
                </h2>
                <Who by="human" />
              </header>
              <p className={styles.standfirst}>
                Starting from {fromLabel(committed)}. <strong>From here, the wording is yours.</strong>
              </p>

              {reading && (committed === "a" || committed === "b") && !reading.routes[committed].draft ? (
                <p className={styles.brief}>
                  <Who by="ai" /> {reading.routes[committed].why}
                </p>
              ) : null}

              {stage === "edit" ? (
                <>
                  <label htmlFor="edit-copy" className={styles.fieldLabel}>
                    Your final copy
                  </label>
                  <textarea
                    id="edit-copy"
                    ref={editRef}
                    className={styles.editInput}
                    value={draft}
                    rows={3}
                    spellCheck
                    placeholder="Write it your way."
                    aria-invalid={editError ? true : undefined}
                    aria-describedby="edit-status edit-error"
                    onChange={(e) => {
                      const value = e.target.value;
                      setDrafts((d) => ({ ...d, [committed]: value }));
                      if (editError) setEditError("");
                    }}
                  />
                  <div className={styles.fieldFoot}>
                    <p id="edit-status" className={styles.meta} aria-live="polite">
                      {editDetail}.
                    </p>
                    {!isUnchanged && committed !== "own" ? (
                      <button
                        type="button"
                        className={styles.textButton}
                        onClick={() => setDrafts((d) => ({ ...d, [committed]: startText }))}
                      >
                        Restore starting text
                      </button>
                    ) : null}
                  </div>
                  <p id="edit-error" className={styles.error} role="alert">
                    {editError}
                  </p>
                  <div className={styles.actions}>
                    <button type="button" className={styles.primary} onClick={approve}>
                      Approve final copy
                    </button>
                    <button type="button" className={styles.textButton} onClick={() => {
                        setCommitted(null);
                        go("routes", "h-call");
                      }}
                    >
                      Change direction
                    </button>
                  </div>
                </>
              ) : (
                <p className={styles.meta}>{editDetail}.</p>
              )}
            </section>
          ) : null}

          {/* 06 FINAL */}
          {approved && stage === "final" ? (
            <section className={`${styles.stage} ${styles.final}`} aria-labelledby="h-final">
              <header className={styles.stageHead}>
                <h2 id="h-final" tabIndex={-1} className={styles.stageTitle}>
                  <span className={styles.num}>06</span> Final copy
                </h2>
                <Who by="human" />
              </header>

              <figure className={styles.finalFigure}>
                <blockquote className={`${styles.finalCopy} ${approved.text.length > 140 ? styles.finalLong : ""}`}>
                  <p>{approved.text}</p>
                </blockquote>
                <figcaption className={styles.meta}>Approved by the writer, {formatTime(approved.at)}</figcaption>
              </figure>

              <div className={styles.actions}>
                <button type="button" className={styles.secondary} onClick={copyFinal}>
                  Copy text
                </button>
                <button type="button" className={styles.textButton} onClick={() => {
                    setApproved(null);
                    setCopied("");
                    go("edit", "h-edit");
                  }}
                >
                  Edit again
                </button>
                <button type="button" className={styles.textButton} onClick={startOver}>
                  Start over
                </button>
                <p className={styles.meta} role="status">
                  {copied}
                </p>
              </div>

              <div className={styles.finalLog}>
                <Authorship rows={rows} summary={summary} variant="full" headingId="h-authorship-full" />
              </div>
            </section>
          ) : null}
        </main>

        <aside className={styles.aside} aria-label="Reference">
          <div className={styles.asideInner}>
            <VoicePanel />
            {stage === "final" ? (
              <p className={styles.asideNote}>
                <a href="#h-authorship-full">Full authorship log</a> sits under the final copy.
              </p>
            ) : (
              <Authorship rows={rows} headingId="h-authorship" />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
