import { useCallback, useEffect, useRef, useState } from 'react'
import Camera from './components/Camera.jsx'
import AdviceCard from './components/AdviceCard.jsx'
import useModel from './hooks/useModel.js'
import usePoints from './hooks/usePoints.js'
import { createStabilizer, topPrediction } from './lib/stabilizer.js'
import { BACKGROUND_LABEL, DETECTION, POINTS_PER_SCAN } from './config.js'

export default function App() {
  const { model, error } = useModel()
  const { points, addScan, error: pointsError } = usePoints()
  const [video, setVideo] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [detection, setDetection] = useState({ status: 'idle', label: null, progress: 0 })
  const [confirmedLabel, setConfirmedLabel] = useState(null) // laatste bevestigde herkenning
  const stabilizer = useRef(createStabilizer({ ...DETECTION, backgroundLabel: BACKGROUND_LABEL }))
  const onReady = useCallback((v) => setVideo(v), [])

  // Voorspel periodiek op het huidige camerabeeld.
  useEffect(() => {
    if (!model || !video) return
    const id = setInterval(async () => {
      const preds = await model.predict(video)
      const top = topPrediction(preds)
      const result = stabilizer.current.push(top)
      setPredictions(preds)
      setDetection(result)
      if (result.status === 'confirmed') {
        setConfirmedLabel(result.label)
        addScan({ label: result.label, confidence: top.probability, points: POINTS_PER_SCAN })
      }
    }, DETECTION.intervalMs)
    return () => clearInterval(id)
  }, [model, video, addScan])

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1>Smart Sort Quest</h1>
        <strong aria-live="polite">{points} punten</strong>
      </header>
      <p>Scan een lege verpakking en ontdek in welke afvalbak ze hoort.</p>
      <Camera onReady={onReady} />
      {error && <p role="alert">{error}</p>}
      {!error && !model && <p>Model laden…</p>}
      {pointsError && <p role="alert">{pointsError}</p>}

      {detection.status === 'detecting' && (
        <div>
          <p style={{ margin: '8px 0 4px' }}>Herkennen: {detection.label}…</p>
          <progress value={detection.progress} max={1} style={{ width: '100%' }} />
        </div>
      )}

      {detection.status === 'locked' && (
        <p style={{ margin: '8px 0 0' }}>+{POINTS_PER_SCAN} punten! Haal de verpakking weg om een volgende te scannen.</p>
      )}

      <AdviceCard label={confirmedLabel} />

      <details style={{ marginTop: 12 }}>
        <summary>Zekerheid per klasse</summary>
        <ul>
          {predictions.map((p) => (
            <li key={p.className}>
              {p.className}: {(p.probability * 100).toFixed(0)}%
            </li>
          ))}
        </ul>
      </details>

      <p style={{ marginTop: 24, fontSize: 14 }}>
        <a href="/vergelijk">Model testen met eigen testfoto's →</a>
      </p>
    </main>
  )
}
