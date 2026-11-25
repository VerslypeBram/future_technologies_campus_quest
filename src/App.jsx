import { useCallback, useEffect, useRef, useState } from 'react'
import Camera from './components/Camera.jsx'
import AdviceCard from './components/AdviceCard.jsx'
import Bins, { takeSnapshot } from './components/Bins.jsx'
import useModel from './hooks/useModel.js'
import usePoints from './hooks/usePoints.js'
import { createStabilizer, topPrediction } from './lib/stabilizer.js'
import './scan.css'
import { BACKGROUND_LABEL, DETECTION, POINTS_PER_SCAN } from './config.js'

function ScanFrame({ frameRef }) {
  return (
    <div ref={frameRef} className="scan-frame" aria-hidden="true">
      <span /><span /><span /><span />
    </div>
  )
}

export default function App() {
  const { model, error } = useModel()
  const { points, addScan, error: pointsError } = usePoints()
  const [video, setVideo] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [detection, setDetection] = useState({ status: 'idle', label: null, progress: 0 })
  const [confirmed, setConfirmed] = useState(null) // laatste bevestigde herkenning: { label, confidence }
  const [toss, setToss] = useState(null) // item dat naar de vuilbak vliegt: { id, label, image }
  const frameRef = useRef(null)
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
        setToss({ id: Date.now(), label: result.label, image: takeSnapshot(video, frameRef.current) })
        addScan({ label: result.label, confidence: top.probability, points: POINTS_PER_SCAN })
      }
    }, DETECTION.intervalMs)
    return () => clearInterval(id)
  }, [model, video, addScan])

  const best = predictions.length ? topPrediction(predictions) : null
  // Tijdens het herkennen van een nieuwe verpakking toont de sheet de voortgang, daarna weer het advies.
  const showAdvice = confirmed && detection.status !== 'detecting'

  return (
    <main className="scan">
      <Camera onReady={onReady}>
        <ScanFrame frameRef={frameRef} />
      </Camera>

      <header className="scan-header">
        <h1 className="scan-title">Smart Sort Quest</h1>
        <p className="scan-points" key={points}>{points} punten</p>
      </header>

      <section className="sheet" aria-label="Scanresultaat">
        <div className="sheet-handle" aria-hidden="true" />
        <Bins
          active={detection.status === 'detecting' ? detection.label : null}
          toss={toss}
          sourceRef={frameRef}
        />
        {error && <p className="scan-alert" role="alert">{error}</p>}
        {pointsError && <p className="scan-alert" role="alert">{pointsError}</p>}
        {!error && (
          <div className="sheet-status" role="status">
            {!model && <p>Model laden…</p>}
            {model && detection.status === 'idle' && <p>Houd een lege verpakking in het kader.</p>}
            {model && detection.status === 'detecting' && (
              <>
                <p>
                  Herkennen: <strong>{detection.label}</strong>
                  {best && ` · ${Math.round(best.probability * 100)}%`}
                </p>
                <div className="meter" aria-hidden="true">
                  <span style={{ width: `${Math.round(detection.progress * 100)}%` }} />
                </div>
              </>
            )}
            {model && (detection.status === 'confirmed' || detection.status === 'locked') && (
              <p>
                <strong>+{POINTS_PER_SCAN} punten!</strong> Haal de verpakking weg voor een volgende scan.
              </p>
            )}
          </div>
        )}

        {showAdvice && <AdviceCard label={confirmed.label} confidence={confirmed.confidence} />}

        {predictions.length > 0 && (
          <ul className="scores" aria-label="Zekerheid per klasse">
            {predictions.map((p) => {
              const value = Math.round(p.probability * 100)
              return (
                <li key={p.className} className="score-row">
                  <span className="score-name">{p.className}</span>
                  <span className="score-value">{value}%</span>
                  <span className="meter" aria-hidden="true">
                    <span style={{ width: `${value}%` }} />
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        <a className="button button-ghost scan-test" href="/vergelijk">Model testen met eigen foto's</a>
      </section>
    </main>
  )
}
