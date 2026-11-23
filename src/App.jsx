import { useCallback, useEffect, useRef, useState } from 'react'
import Camera from './components/Camera.jsx'
import AdviceCard from './components/AdviceCard.jsx'
import useModel from './hooks/useModel.js'
import { createStabilizer, topPrediction } from './lib/stabilizer.js'
import { BACKGROUND_LABEL, DETECTION } from './config.js'

export default function App() {
  const { model, error } = useModel()
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
      const result = stabilizer.current.push(topPrediction(preds))
      setPredictions(preds)
      setDetection(result)
      if (result.status === 'confirmed') setConfirmedLabel(result.label)
    }, DETECTION.intervalMs)
    return () => clearInterval(id)
  }, [model, video])

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Smart Sort Quest</h1>
      <p>Scan een lege verpakking en ontdek in welke afvalbak ze hoort.</p>
      <Camera onReady={onReady} />
      {error && <p role="alert">{error}</p>}
      {!error && !model && <p>Model laden…</p>}

      {detection.status === 'detecting' && (
        <div>
          <p style={{ margin: '8px 0 4px' }}>Herkennen: {detection.label}…</p>
          <progress value={detection.progress} max={1} style={{ width: '100%' }} />
        </div>
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
    </main>
  )
}
