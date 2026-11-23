import { useCallback, useEffect, useRef, useState } from 'react'
import Camera from './components/Camera.jsx'
import AdviceCard from './components/AdviceCard.jsx'
import useModel from './hooks/useModel.js'
import usePoints from './hooks/usePoints.js'
import { createStabilizer, topPrediction } from './lib/stabilizer.js'
import { BACKGROUND_LABEL, DETECTION, POINTS_PER_SCAN } from './config.js'

// Scankader: vier witte hoeken midden in het camerabeeld.
const corner = { position: 'absolute', width: 26, height: 26, border: '3px solid #fff' }
const corners = [
  { left: 0, top: 0, borderRight: 0, borderBottom: 0, borderTopLeftRadius: 8 },
  { right: 0, top: 0, borderLeft: 0, borderBottom: 0, borderTopRightRadius: 8 },
  { left: 0, bottom: 0, borderRight: 0, borderTop: 0, borderBottomLeftRadius: 8 },
  { right: 0, bottom: 0, borderLeft: 0, borderTop: 0, borderBottomRightRadius: 8 },
]

function ScanFrame() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', left: '50%', top: '38%', width: '42%', aspectRatio: '1', transform: 'translate(-50%, -50%)' }}
    >
      {corners.map((c, i) => (
        <span key={i} style={{ ...corner, ...c }} />
      ))}
    </div>
  )
}

// Statusbalk onderaan het camerabeeld.
function StatusBar({ children }) {
  return (
    <div
      aria-live="polite"
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.55)', color: '#fff',
        padding: '10px 12px', borderRadius: '0 0 12px 12px',
      }}
    >
      {children}
    </div>
  )
}

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
      <Camera onReady={onReady}>
        <ScanFrame />
        {!error && (
          <StatusBar>
            {!model && <p style={{ margin: 0 }}>Model laden…</p>}
            {model && detection.status === 'idle' && (
              <p style={{ margin: 0 }}>Houd een lege verpakking in het kader.</p>
            )}
            {model && detection.status === 'detecting' && (
              <>
                <p style={{ margin: 0 }}>Herkennen: {detection.label}…</p>
                <progress value={detection.progress} max={1} style={{ width: '100%', marginTop: 6 }} />
              </>
            )}
            {model && (detection.status === 'confirmed' || detection.status === 'locked') && (
              <p style={{ margin: 0 }}>+{POINTS_PER_SCAN} punten! Haal de verpakking weg om een volgende te scannen.</p>
            )}
          </StatusBar>
        )}
      </Camera>
      {error && <p role="alert">{error}</p>}
      {pointsError && <p role="alert">{pointsError}</p>}

      <AdviceCard label={confirmedLabel} />

      <details style={{ marginTop: 20, fontSize: 13, color: '#64748b' }}>
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
