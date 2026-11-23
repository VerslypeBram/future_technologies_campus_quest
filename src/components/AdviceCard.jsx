import { WASTE_CLASSES } from '../config.js'

// Toont in welke afvalbak de herkende verpakking hoort.
export default function AdviceCard({ label }) {
  const advice = WASTE_CLASSES[label]
  if (!advice) return null
  return (
    <section
      aria-live="polite"
      style={{ borderLeft: `8px solid ${advice.color}`, background: '#f8fafc', padding: 12, borderRadius: 8, marginTop: 12 }}
    >
      <p style={{ margin: 0, fontSize: 14 }}>Herkend: {label}</p>
      <h2 style={{ margin: '4px 0', color: advice.color }}>{advice.bin}</h2>
      <p style={{ margin: 0 }}>{advice.tip}</p>
    </section>
  )
}
