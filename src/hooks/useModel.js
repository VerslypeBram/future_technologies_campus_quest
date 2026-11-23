import { useEffect, useState } from 'react'
import * as tmImage from '@teachablemachine/image'
import { MODEL_URL } from '../config.js'

// Het model maar één keer laden: een tweede load in dezelfde pagina geeft in
// tfjs de fout "Variable ... was already registered" (bv. door React StrictMode).
let modelPromise = null
export function loadModel() {
  modelPromise ??= tmImage.load(`${MODEL_URL}model.json`, `${MODEL_URL}metadata.json`)
  return modelPromise
}

// Laadt het Teachable Machine-model. Alles draait lokaal in de browser.
export default function useModel() {
  const [model, setModel] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    loadModel()
      .then((m) => !cancelled && setModel(m))
      .catch((err) => {
        console.error(err)
        if (!cancelled) setError(`Model niet gevonden op ${MODEL_URL}. Zie public/model/LEESMIJ.md.`)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { model, error }
}
