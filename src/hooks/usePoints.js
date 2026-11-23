import { useCallback, useEffect, useState } from 'react'
import { saveScan, watchPoints, watchUser } from '../lib/firebase.js'

// Anonieme gebruiker + live puntentotaal uit Firestore.
export default function usePoints() {
  const [uid, setUid] = useState(null)
  const [points, setPoints] = useState(0)
  const [error, setError] = useState(null)

  useEffect(
    () =>
      watchUser((id, err) => {
        if (err) {
          console.error(err)
          setError('Inloggen bij Firebase mislukt. Punten worden niet opgeslagen.')
        } else setUid(id)
      }),
    [],
  )

  useEffect(() => (uid ? watchPoints(uid, setPoints) : undefined), [uid])

  const addScan = useCallback(
    (scan) =>
      uid &&
      saveScan(uid, scan).catch((err) => {
        console.error(err)
        setError('Punten opslaan mislukt.')
      }),
    [uid],
  )

  return { points, addScan, error, ready: Boolean(uid) }
}
