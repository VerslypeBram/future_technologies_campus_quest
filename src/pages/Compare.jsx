import { useEffect, useState } from 'react'
import * as tmImage from '@teachablemachine/image'
import { MODEL_URL } from '../config.js'
import { evaluate } from '../lib/metrics.js'
import { topPrediction } from '../lib/stabilizer.js'

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

// Testpagina: laat het model los op eigen testfoto's (die niet in de trainingsset zaten)
// en toont nauwkeurigheid per klasse + verwarringsmatrix.
export default function Compare() {
  const [labels, setLabels] = useState(null)
  const [files, setFiles] = useState({}) // { label: File[] }
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Klassen uit metadata.json halen zonder het model al te laden.
  useEffect(() => {
    fetch(`${MODEL_URL}metadata.json`)
      .then((r) => r.json())
      .then((m) => setLabels(m.labels))
      .catch(() => setError(`Geen model gevonden op ${MODEL_URL}.`))
  }, [])

  async function run() {
    setBusy(true)
    setResult(null)
    let model
    try {
      model = await tmImage.load(`${MODEL_URL}model.json`, `${MODEL_URL}metadata.json`)
      const results = []
      for (const expected of labels) {
        for (const file of files[expected] ?? []) {
          const { img, url } = await loadImage(file)
          const predicted = topPrediction(await model.predict(img)).className
          URL.revokeObjectURL(url)
          results.push({ expected, predicted, file: file.name })
        }
      }
      setResult({ ...evaluate(labels, results), results })
    } catch (err) {
      console.error(err)
      setError('Evalueren mislukt. Zie de console.')
    } finally {
      model?.dispose() // vrijgeven, zodat een volgend model geladen kan worden
      setBusy(false)
    }
  }

  const count = Object.values(files).reduce((s, f) => s + f.length, 0)

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <p><a href="/">← Terug naar scannen</a></p>
      <h1>Model testen</h1>
      <p>
        Kies per klasse testfoto's die <strong>niet</strong> in de trainingsset zaten. De foto's blijven op je toestel.
      </p>
      {error && <p role="alert">{error}</p>}

      {labels?.map((label) => (
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

      {labels && (
        <button onClick={run} disabled={busy || count === 0}>
          {busy ? 'Bezig…' : `Evalueer ${count} foto's`}
        </button>
      )}

      {result && (
        <section>
          <h2>Nauwkeurigheid: {pct(result.accuracy)} ({result.correct}/{result.total})</h2>
          <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr><th>Klasse</th><th>Juist</th><th>Nauwkeurigheid</th></tr>
            </thead>
            <tbody>
              {result.perClass.map((c) => (
                <tr key={c.label}><td>{c.label}</td><td>{c.correct}/{c.total}</td><td>{pct(c.accuracy)}</td></tr>
              ))}
            </tbody>
          </table>

          <h3>Verwarringsmatrix (rij = echt, kolom = voorspeld)</h3>
          <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr><th></th>{labels.map((l) => <th key={l}>{l}</th>)}</tr>
            </thead>
            <tbody>
              {labels.map((row) => (
                <tr key={row}>
                  <th>{row}</th>
                  {labels.map((col) => (
                    <td key={col} style={{ textAlign: 'center', background: row === col ? '#dcfce7' : result.matrix[row][col] ? '#fee2e2' : undefined }}>
                      {result.matrix[row][col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Fout voorspeld</h3>
          <ul>
            {result.results.filter((r) => r.expected !== r.predicted).map((r) => (
              <li key={r.expected + r.file}>{r.file}: {r.expected} → {r.predicted}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
