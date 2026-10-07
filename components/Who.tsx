import styles from "./who.module.css";

export type Author = "human" | "ai";

const LABEL: Record<Author, string> = {
  human: "Human",
  ai: "AI-assisted",
};

/** A small provenance tag. Filled mark for the writer, open mark for AI. */
export function Who({ by, muted = false }: { by: Author; muted?: boolean }) {
  return (
    <span className={`${styles.who} ${styles[by]} ${muted ? styles.muted : ""}`}>
      <span className={styles.mark} aria-hidden="true" />
      {LABEL[by]}
    </span>
  );
}
