import { WASTE_CLASSES } from '../config.js'

// Toont in welke afvalbak de herkende verpakking hoort, met de zekerheid van het model.
export default function AdviceCard({ label, confidence }) {
  const advice = WASTE_CLASSES[label]
  if (!advice) return null
  return (
    <article className="advice" aria-label="Sorteeradvies">
      <span className="advice-chip" style={{ background: advice.color }} aria-hidden="true" />
      <div>
        <h2 className="advice-bin">{advice.bin}</h2>
        <p className="advice-meta">
          {label}
          {confidence != null && `, ${Math.round(confidence * 100)}% zeker`}
        </p>
      </div>
      <p className="advice-tip">{advice.tip}</p>
    </article>
  )
}
