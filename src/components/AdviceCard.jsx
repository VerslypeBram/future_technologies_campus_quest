import { WASTE_CLASSES } from '../config.js'

// Toont in welke afvalbak de herkende verpakking hoort, met de zekerheid van het model.
export default function AdviceCard({ label, confidence }) {
  const advice = WASTE_CLASSES[label]
  if (!advice) return null
  return (
    <section className="advice" style={{ '--bin': advice.color }} aria-label="Sorteeradvies">
      <p className="advice-meta">
        <span>Herkend: {label}</span>
        {confidence != null && <span>{Math.round(confidence * 100)}% zeker</span>}
      </p>
      <h2 className="advice-bin">{advice.bin}</h2>
      <p className="advice-tip">{advice.tip}</p>
    </section>
  )
}
