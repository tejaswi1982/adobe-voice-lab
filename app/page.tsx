import { Lab } from "@/components/Lab";
import { Who } from "@/components/Who";
import { EXAMPLE_COPY } from "@/lib/samples";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <header className={styles.masthead}>
        <div className={styles.bar}>
          <p className={styles.wordmark}>Adobe Voice Lab</p>
          <p className={styles.status}>
            <span>Speculative prototype</span>
            <span aria-hidden="true">/</span>
            <span>Independent concept</span>
          </p>
        </div>

        <h1 className={styles.thesis}>
          AI should help a writer make better choices, <em>not simply make more copy.</em>
        </h1>
        <p className={styles.lede}>
          The tool reads first, judges second and recommends two directions. The writer chooses, edits and
          approves. Every step says who did what.
        </p>
      </header>

      <section className={styles.journey} aria-labelledby="journey-title">
        <h2 id="journey-title" className={styles.journeyTitle}>
          One example, start to finish
        </h2>
        <ol className={styles.steps}>
          <li className={styles.step}>
            <p className={styles.stepHead}>
              <span>Before</span> <Who by="human" />
            </p>
            <p className={styles.stepCopy}>&ldquo;{EXAMPLE_COPY}&rdquo;</p>
          </li>
          <li className={styles.step}>
            <p className={styles.stepHead}>
              <span>The read</span> <Who by="ai" />
            </p>
            <p className={styles.stepNote}>
              Clear.
              <br />
              Generic.
              <br />
              Category language.
              <br />
              No distinctive point of view.
            </p>
          </li>
          <li className={styles.step}>
            <p className={styles.stepHead}>
              <span>Two ways forward</span> <Who by="ai" />
            </p>
            <dl className={styles.routes}>
              <div>
                <dt>A</dt>
                <dd>Clarify</dd>
              </div>
              <div>
                <dt>B</dt>
                <dd>Push</dd>
              </div>
            </dl>
          </li>
          <li className={styles.step}>
            <p className={styles.stepHead}>
              <span>Your call</span> <Who by="human" />
            </p>
            <p className={styles.stepNote}>The writer chooses B.</p>
          </li>
          <li className={styles.step}>
            <p className={styles.stepHead}>
              <span>Human edit</span> <Who by="human" />
            </p>
            <p className={styles.stepCopy}>
              <span className={styles.suggested}>The first idea doesn&rsquo;t have to be the final one.</span>
              <br />
              Try another.
              <br />
              Then another.
              <br />
              Keep the one that feels right.
            </p>
            <p className={styles.stepKey}>
              <span className={styles.suggested}>Slate</span>: suggested. Ink: written by the writer.
            </p>
          </li>
          <li className={styles.step}>
            <p className={styles.stepHead}>
              <span>Final</span> <Who by="human" />
            </p>
            <p className={styles.stepNote}>Approved by the writer. Authorship logged, line by line.</p>
          </li>
        </ol>
      </section>

      <Lab />

      <footer className={styles.about} aria-labelledby="about-title">
        <h2 id="about-title" className={styles.aboutTitle}>
          About
        </h2>
        <div className={styles.aboutBody}>
          <p>
            Adobe Voice Lab is an independent speculative prototype exploring how AI might support professional
            writers without removing authorship, judgment or creative responsibility.
          </p>
          <p>
            Built using publicly available Adobe brand and voice principles. Not affiliated with or endorsed by
            Adobe.
          </p>
        </div>
      </footer>
    </>
  );
}
