import { Who, type Author } from "./Who";
import styles from "./authorship.module.css";

export interface AuthorshipRow {
  label: string;
  by: Author;
  done: boolean;
  detail?: string;
}

interface Props {
  rows: AuthorshipRow[];
  /** Plain statement of where the final words came from. Shown once approved. */
  summary?: string;
  variant?: "panel" | "full";
  headingId: string;
}

export function Authorship({ rows, summary, variant = "panel", headingId }: Props) {
  const Heading = variant === "full" ? "h3" : "h2";
  return (
    <section className={`${styles.authorship} ${styles[variant]}`} aria-labelledby={headingId}>
      <Heading id={headingId} className={styles.title}>
        Authorship
      </Heading>
      {summary ? <p className={styles.summary}>{summary}</p> : null}
      <ol className={styles.rows}>
        {rows.map((row) => (
          <li key={row.label} className={`${styles.row} ${row.done ? "" : styles.pending}`}>
            <span className={styles.label}>{row.label}</span>
            <Who by={row.by} muted={!row.done} />
            <span className={styles.detail}>{row.done ? row.detail : "Not yet"}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
