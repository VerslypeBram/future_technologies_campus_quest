import { useEffect, useState } from 'react'
import * as tmImage from '@teachablemachine/image'
import { COMPARE_MODELS } from '../config.js'
import { evaluate } from '../lib/metrics.js'
import { topPrediction } from '../lib/stabilizer.js'

const pct = (v) => (v === null ? '–' : `${Math.round(v * 100)}%`)
const table = { borderCollapse: 'collapse', marginBottom: 12 }

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

const sameLabels = (a, b) => a.length === b.length && a.every((l) => b.includes(l))

// Testpagina: laat elk model los op dezelfde testfoto's (die niet in de trainingsset
// zaten) en zet nauwkeurigheid en verwarringsmatrix naast elkaar.
export default function Compare() {
  const [models, setModels] = useState(null) // beschikbare modellen met hun klassen
  const [files, setFiles] = useState({}) // { label: File[] }
  const [results, setResults] = useState(null) // per model: evaluate(...) + voorspellingen
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

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

  const count = Object.values(files).reduce((s, f) => s + f.length, 0)
  // Foto's waarover de modellen het oneens zijn.
  const disagreements =
    results?.length > 1
      ? results[0].preds
          .map((p, i) => ({ ...p, all: results.map((r) => r.preds[i].predicted) }))
          .filter((p) => new Set(p.all).size > 1)
      : []

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <p><a href="/">← Terug naar scannen</a></p>
      <h1>Modellen vergelijken</h1>
      <p>
        Kies per klasse testfoto's die <strong>niet</strong> in de trainingssets zaten. Elk model krijgt dezelfde
        foto's. De foto's blijven op je toestel.
      </p>

      {missing.map((m) => (
        <p key={m.name} style={{ color: '#b45309' }}>Model "{m.name}" niet gevonden op {m.url} (wordt overgeslagen).</p>
      ))}
      {mismatch && (
        <p role="alert">
          De klassen van "{mismatch.name}" verschillen van "{available[0].name}". Gebruik in beide modellen exact
          dezelfde klassennamen.
        </p>
      )}
      {models && available.length === 0 && <p role="alert">Geen enkel model gevonden.</p>}
      {error && <p role="alert">{error}</p>}

      {labels && !mismatch && (
        <>
          {labels.map((label) => (
            <label key={label} style={{ display: 'block', margin: '8px 0' }}>
              <strong>{label}</strong> ({files[label]?.length ?? 0} foto's)
              <br />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles((f) => ({ ...f, [label]: [...e.target.files] }))}
              />
            </label>
          ))}
          <button onClick={run} disabled={busy || count === 0}>
            {busy ? 'Bezig…' : `Evalueer ${count} foto's met ${available.length} model(len)`}
          </button>
        </>
      )}

      {results && (
        <section>
          <h2>Nauwkeurigheid</h2>
          <table border="1" cellPadding="6" style={table}>
            <thead>
              <tr>
                <th>Klasse</th>
                {results.map((r) => <th key={r.name}>{r.name}</th>)}
                {results.length === 2 && <th>Verschil (B − A)</th>}
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
                  <tr key={label ?? 'totaal'} style={label ? undefined : { fontWeight: 'bold' }}>
                    <td>{label ?? 'Totaal'}</td>
                    {cells.map((c, i) => <td key={i}>{pct(c.accuracy)} ({c.correct}/{c.total})</td>)}
                    {results.length === 2 && <td>{diff === null ? '–' : `${diff > 0 ? '+' : ''}${diff} %-punt`}</td>}
                  </tr>
                )
              })}
            </tbody>
          </table>

          {results.map((r) => (
            <div key={r.name}>
              <h3>Verwarringsmatrix {r.name} (rij = echt, kolom = voorspeld)</h3>
              <table border="1" cellPadding="6" style={table}>
                <thead>
                  <tr><th></th>{labels.map((l) => <th key={l}>{l}</th>)}</tr>
                </thead>
                <tbody>
                  {labels.map((row) => (
                    <tr key={row}>
                      <th>{row}</th>
                      {labels.map((col) => (
                        <td
                          key={col}
                          style={{ textAlign: 'center', background: row === col ? '#dcfce7' : r.matrix[row][col] ? '#fee2e2' : undefined }}
                        >
                          {r.matrix[row][col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {results.length > 1 && (
            <>
              <h3>Foto's waarover de modellen het oneens zijn ({disagreements.length})</h3>
              <ul>
                {disagreements.map((d) => (
                  <li key={d.expected + d.file}>
                    {d.file} (echt: {d.expected}) → {results.map((r, i) => `${r.name.split(':')[0]}: ${d.all[i]}`).join(', ')}
                  </li>
                ))}
              </ul>
            </>
          )}

          {results.map((r) => (
            <details key={r.name}>
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
