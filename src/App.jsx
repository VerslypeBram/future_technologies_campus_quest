import { useCallback, useEffect, useRef, useState } from 'react'
import Camera from './components/Camera.jsx'
import AdviceCard from './components/AdviceCard.jsx'
import useModel from './hooks/useModel.js'
import usePoints from './hooks/usePoints.js'
import { createStabilizer, topPrediction } from './lib/stabilizer.js'
import './scan.css'
import { BACKGROUND_LABEL, DETECTION, POINTS_PER_SCAN } from './config.js'

function ScanFrame() {
  return (
    <div className="scan-frame" aria-hidden="true">
      <span /><span /><span /><span />
    </div>
  )
}

// Statusbalk onderaan het camerabeeld. Alleen de tekst wordt voorgelezen, de balk niet.
function StatusBar({ children }) {
  return <div className="status-bar" role="status">{children}</div>
}

export default function App() {
  const { model, error } = useModel()
  const { points, addScan, error: pointsError } = usePoints()
  const [video, setVideo] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [detection, setDetection] = useState({ status: 'idle', label: null, progress: 0 })
  const [confirmed, setConfirmed] = useState(null) // laatste bevestigde herkenning: { label, confidence }
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
        setConfirmed({ label: result.label, confidence: top.probability })
        addScan({ label: result.label, confidence: top.probability, points: POINTS_PER_SCAN })
      }
    }, DETECTION.intervalMs)
    return () => clearInterval(id)
  }, [model, video, addScan])

  return (
    <main className="scan">
      <header className="scan-header">
        <h1 className="scan-title">Smart Sort Quest</h1>
        <p className="scan-points">{points} punten</p>
      </header>
      <p className="scan-intro">Scan een lege verpakking en ontdek in welke afvalbak ze hoort.</p>
      <Camera onReady={onReady}>
        <ScanFrame />
        {!error && (
          <StatusBar>
            {!model && <p>Model laden…</p>}
            {model && detection.status === 'idle' && <p>Houd een lege verpakking in het kader.</p>}
            {model && detection.status === 'detecting' && (
              <>
                <p>
                  <span className="status-label">Herkennen: </span>
                  {detection.label}
                </p>
                <div className="meter" aria-hidden="true">
                  <span style={{ width: `${Math.round(detection.progress * 100)}%` }} />
                </div>
              </>
            )}
            {model && (detection.status === 'confirmed' || detection.status === 'locked') && (
              <p>+{POINTS_PER_SCAN} punten! Haal de verpakking weg voor een volgende scan.</p>
            )}
          </StatusBar>
        )}
      </Camera>
      {error && <p className="scan-alert" role="alert">{error}</p>}
      {pointsError && <p className="scan-alert" role="alert">{pointsError}</p>}

      <AdviceCard label={confirmed?.label} confidence={confirmed?.confidence} />

      <div className="scan-extra">
        <details>
          <summary>Zekerheid per klasse</summary>
          <ul>
            {predictions.map((p) => (
              <li key={p.className}>
                {p.className}: {(p.probability * 100).toFixed(0)}%
              </li>
            ))}
          </ul>
        </details>
        <a href="/vergelijk">Model testen met eigen testfoto's</a>
      </div>
    </main>
  )
}
