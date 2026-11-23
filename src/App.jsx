import { useCallback, useEffect, useState } from 'react'
import Camera from './components/Camera.jsx'
import useModel from './hooks/useModel.js'

const INTERVAL_MS = 250 // ~4 voorspellingen per seconde

export default function App() {
  const { model, error } = useModel()
  const [video, setVideo] = useState(null)
  const [predictions, setPredictions] = useState([])
  const onReady = useCallback((v) => setVideo(v), [])

  // Voorspel periodiek op het huidige camerabeeld.
  useEffect(() => {
    if (!model || !video) return
    const id = setInterval(async () => {
      setPredictions(await model.predict(video))
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [model, video])

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Smart Sort Quest</h1>
      <p>Scan een lege verpakking en ontdek in welke afvalbak ze hoort.</p>
      <Camera onReady={onReady} />
      {error && <p role="alert">{error}</p>}
      {!error && !model && <p>Model laden…</p>}
      <ul>
        {predictions.map((p) => (
          <li key={p.className}>
            {p.className}: {(p.probability * 100).toFixed(0)}%
          </li>
        ))}
      </ul>
    </main>
  )
}
