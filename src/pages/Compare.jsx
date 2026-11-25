import { useCallback, useEffect, useState } from 'react'
import * as tmImage from '@teachablemachine/image'
import Camera from '../components/Camera.jsx'
import { COMPARE_MODELS, WASTE_CLASSES } from '../config.js'
import { evaluate } from '../lib/metrics.js'
import { topPrediction } from '../lib/stabilizer.js'
import '../vergelijk.css'

const pct = (v) => (v === null ? '–' : `${Math.round(v * 100)}%`)

// Laadt een gekozen bestand als afbeelding. Blijft lokaal in de browser.
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = reject
    img.src = url
  })
}

// Haalt de klassen van elk model op (metadata.json), zonder de modellen te laden.
async function loadMetadata() {
  return Promise.all(
    COMPARE_MODELS.map(async (m) => {
      try {
        const meta = await (await fetch(`${m.url}metadata.json`)).json()
        return { ...m, labels: meta.labels }
      } catch {
        return { ...m, labels: null }
      }
    }),
  )
}

// Neemt het huidige camerabeeld als JPEG-bestand. Blijft lokaal in de browser.
function captureFrame(video, name) {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d').drawImage(video, 0, 0)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(new File([blob], name, { type: 'image/jpeg' })) : reject()), 'image/jpeg', 0.9),
  )
}

// Kleine preview van een testfoto met een knop om ze te verwijderen.
function Thumb({ file, onRemove }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return (
    <span className="cmp-thumb">
      {url && <img src={url} alt={file.name} />}
      <button type="button" onClick={onRemove} aria-label={`Verwijder ${file.name}`}>✕</button>
    </span>
  )
}

const sameLabels = (a, b) => a.length === b.length && a.every((l) => b.includes(l))

// Testpagina: laat elk model los op dezelfde testfoto's (die niet in de trainingsset
// zaten) en zet nauwkeurigheid en verwarringsmatrix naast elkaar.
export default function Compare() {
  const [models, setModels] = useState(null) // beschikbare modellen met hun klassen
  const [files, setFiles] = useState({}) // { label: File[] }
  const [results, setResults] = useState(null) // per model: evaluate(...) + voorspellingen
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [video, setVideo] = useState(null) // live camerabeeld
  const [shotLabel, setShotLabel] = useState(null) // klasse waarvoor je foto's neemt
  const onReady = useCallback((v) => setVideo(v), [])

  useEffect(() => {
    loadMetadata().then(setModels)
  }, [])

  const available = models?.filter((m) => m.labels) ?? []
  const missing = models?.filter((m) => !m.labels) ?? []
  const labels = available[0]?.labels
  const mismatch = available.find((m) => !sameLabels(m.labels, labels))

  async function run() {
    setBusy(true)
    setResults(null)
    setError(null)
    try {
      const images = []
      for (const expected of labels) {
        for (const file of files[expected] ?? []) images.push({ expected, file, ...(await loadImage(file)) })
      }

      // Modellen na elkaar laden en vrijgeven: twee TM-modellen tegelijk geven in
      // tfjs de fout "Variable ... was already registered".
      const out = []
      for (const m of available) {
        const model = await tmImage.load(`${m.url}model.json`, `${m.url}metadata.json`)
        try {
          const preds = []
          for (const { expected, file, img } of images) {
            preds.push({ expected, file: file.name, predicted: topPrediction(await model.predict(img)).className })
          }
          out.push({ name: m.name, preds, ...evaluate(labels, preds) })
        } finally {
          // model.dispose() van TM werkt niet voor geladen modellen; daarom het
          // onderliggende tfjs-model zelf vrijgeven.
          model.model.dispose()
        }
      }
      images.forEach(({ url }) => URL.revokeObjectURL(url))
      setResults(out)
    } catch (err) {
      console.error(err)
      setError('Evalueren mislukt. Zie de console.')
    } finally {
      setBusy(false)
    }
  }

  const addFiles = (label, list) => setFiles((f) => ({ ...f, [label]: [...(f[label] ?? []), ...list] }))
  const removeFile = (label, file) => setFiles((f) => ({ ...f, [label]: f[label].filter((x) => x !== file) }))

  async function takePhoto() {
    const label = shotLabel ?? labels[0]
    if (!video?.videoWidth) return
    const n = (files[label]?.length ?? 0) + 1
    addFiles(label, [await captureFrame(video, `${label.replace(/\W+/g, "-")}-camera-${n}-${Date.now() % 100000}.jpg`)])
  }

  const count = Object.values(files).reduce((s, f) => s + f.length, 0)
  // Foto's waarover de modellen het oneens zijn.
  const disagreements =
    results?.length > 1
      ? results[0].preds
          .map((p, i) => ({ ...p, all: results.map((r) => r.preds[i].predicted) }))
          .filter((p) => new Set(p.all).size > 1)
      : []

  const current = shotLabel ?? labels?.[0]

  return (
    <main className="cmp">
      <header className="cmp-header">
        <a className="cmp-pill" href="/">← Scannen</a>
        <h1 className="cmp-pill">Model testen</h1>
      </header>

      <section className="cmp-card" aria-label="Testfoto's nemen">
        <h2>Testfoto's nemen</h2>
        <p className="cmp-intro">
          Fotografeer per klasse verpakkingen die <strong>niet</strong> in de trainingsset zaten. Elk model krijgt
          dezelfde foto's. De foto's blijven op je toestel.
        </p>

        {missing.map((m) => (
          <p key={m.name} className="cmp-warn">Model "{m.name}" niet gevonden op {m.url} (wordt overgeslagen).</p>
        ))}
        {mismatch && (
          <p className="cmp-alert" role="alert">
            De klassen van "{mismatch.name}" verschillen van "{available[0].name}". Gebruik in beide modellen exact
            dezelfde klassennamen.
          </p>
        )}
        {models && available.length === 0 && <p className="cmp-alert" role="alert">Geen enkel model gevonden.</p>}
        {error && <p className="cmp-alert" role="alert">{error}</p>}

        {labels && !mismatch && (
          <>
            <div className="cmp-cam">
              <Camera onReady={onReady}>
                <div className="scan-frame" aria-hidden="true">
                  <span /><span /><span /><span />
                </div>
              </Camera>
            </div>

            <p className="cmp-label" id="cmp-klasse">Foto's voor klasse</p>
            <div className="cmp-chips" role="group" aria-labelledby="cmp-klasse">
              {labels.map((label) => (
                <button
                  key={label}
                  type="button"
                  className="cmp-chip"
                  aria-pressed={current === label}
                  onClick={() => setShotLabel(label)}
                >
                  {WASTE_CLASSES[label] && <span className="cmp-dot" style={{ background: WASTE_CLASSES[label].color }} aria-hidden="true" />}
                  {label} <span className="cmp-count">({files[label]?.length ?? 0})</span>
                </button>
              ))}
            </div>

            <button type="button" className="button" onClick={takePhoto} disabled={!video}>
              📷 Foto nemen voor {current}
            </button>

            {count > 0 && (
              <div className="cmp-shots">
                {labels.filter((l) => files[l]?.length).map((label) => (
                  <div key={label} className="cmp-shots-row">
                    <strong>{label}</strong> <span className="cmp-count">({files[label].length} foto's)</span>
                    <div className="cmp-thumbs">
                      {files[label].map((file) => (
                        <Thumb key={file.name + file.lastModified} file={file} onRemove={() => removeFile(label, file)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <details className="scan-extra">
              <summary>Of bestanden kiezen</summary>
              {labels.map((label) => (
                <label key={label} className="cmp-file">
                  {label}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      addFiles(label, [...e.target.files])
                      e.target.value = ''
                    }}
                  />
                </label>
              ))}
            </details>

            <button type="button" className="button" onClick={run} disabled={busy || count === 0}>
              {busy ? 'Bezig…' : `Evalueer ${count} foto's met ${available.length} model(len)`}
            </button>
          </>
        )}
      </section>

      {results && (
        <section className="cmp-card" aria-label="Uitslag">
          <h2>Nauwkeurigheid</h2>
          <div className="cmp-scores">
            {results.map((r) => (
              <div key={r.name} className="cmp-score">
                <p className="cmp-score-name">{r.name}</p>
                <p className="cmp-score-num">{pct(r.accuracy)}</p>
                <p className="cmp-score-sub">{r.correct} van {r.total} goed</p>
              </div>
            ))}
          </div>

          <h3>Per klasse</h3>
          <div className="cmp-scroll">
            <table className="cmp-table">
              <thead>
                <tr>
                  <th>Klasse</th>
                  {results.map((r) => <th key={r.name} className="num">{r.name}</th>)}
                  {results.length === 2 && <th className="num">Verschil (B − A)</th>}
                </tr>
              </thead>
              <tbody>
                {[...labels, null].map((label) => {
                  const cells = results.map((r) => (label ? r.perClass.find((c) => c.label === label) : r))
                  const diff =
                    results.length === 2 && cells[0].accuracy !== null && cells[1].accuracy !== null
                      ? Math.round((cells[1].accuracy - cells[0].accuracy) * 100)
                      : null
                  return (
                    <tr key={label ?? 'totaal'} className={label ? undefined : 'total'}>
                      <th scope="row">{label ?? 'Totaal'}</th>
                      {cells.map((c, i) => <td key={i} className="num">{pct(c.accuracy)} ({c.correct}/{c.total})</td>)}
                      {results.length === 2 && <td className="num">{diff === null ? '–' : `${diff > 0 ? '+' : ''}${diff} %-punt`}</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {results.map((r) => (
            <div key={r.name}>
              <h3>Verwarringsmatrix {r.name}</h3>
              <p className="cmp-sticky-note">Rij = echt, kolom = voorspeld.</p>
              <div className="cmp-scroll">
                <table className="cmp-table cmp-matrix">
                  <thead>
                    <tr><th></th>{labels.map((l) => <th key={l} className="num">{l}</th>)}</tr>
                  </thead>
                  <tbody>
                    {labels.map((row) => (
                      <tr key={row}>
                        <th scope="row">{row}</th>
                        {labels.map((col) => (
                          <td key={col} className={`cell ${row === col ? 'ok' : r.matrix[row][col] ? 'bad' : ''}`}>
                            {r.matrix[row][col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {results.length > 1 && (
            <>
              <h3>Foto's waarover de modellen het oneens zijn ({disagreements.length})</h3>
              <ul className="cmp-list">
                {disagreements.map((d) => (
                  <li key={d.expected + d.file}>
                    {d.file} (echt: {d.expected}) → {results.map((r, i) => `${r.name.split(':')[0]}: ${d.all[i]}`).join(', ')}
                  </li>
                ))}
              </ul>
            </>
          )}

          {results.map((r) => (
            <details key={r.name} className="scan-extra">
              <summary>Fout voorspeld door {r.name} ({r.total - r.correct})</summary>
              <ul>
                {r.preds.filter((p) => p.expected !== p.predicted).map((p) => (
                  <li key={p.expected + p.file}>{p.file}: {p.expected} → {p.predicted}</li>
                ))}
              </ul>
            </details>
          ))}
        </section>
      )}
    </main>
  )
}
