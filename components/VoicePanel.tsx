import styles from "./voice.module.css";

export const PRINCIPLES = [
  { name: "Rational", gloss: "Clear. Useful. Grounded." },
  { name: "Human", gloss: "Natural. Empathetic. Never robotic." },
  { name: "Focused", gloss: "One idea at a time. Remove what does not help." },
] as const;

export function VoicePanel() {
  return (
    <section className={styles.voice} aria-labelledby="voice-title">
      <h2 id="voice-title" className={styles.title}>
        Voice
        <span className={styles.kicker}>Public principles</span>
      </h2>
      <dl className={styles.list}>
        {PRINCIPLES.map((p) => (
          <div key={p.name} className={styles.item}>
            <dt>{p.name}</dt>
            <dd>{p.gloss}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.source}>Paraphrased from Adobe&rsquo;s publicly shared voice and tone guidance.</p>
    </section>
  );
}
