import { useCallback, useEffect, useState } from 'react'
import { saveScan, watchScanCount, watchUser } from '../lib/firebase.js'

// Anonieme gebruiker + live aantal gesorteerde verpakkingen uit Firestore.
// saveScan bewaart per scan ook de punten, maar die worden niet getoond.
export default function useScans() {
  const [uid, setUid] = useState(null)
  const [count, setCount] = useState(0)
  const [error, setError] = useState(null)

  useEffect(
    () =>
      watchUser((id, err) => {
        if (err) {
          console.error(err)
          setError('Inloggen bij Firebase mislukt. Scans worden niet opgeslagen.')
        } else setUid(id)
      }),
    [],
  )

  useEffect(() => (uid ? watchScanCount(uid, setCount) : undefined), [uid])

  const addScan = useCallback(
    (scan) =>
      uid &&
      saveScan(uid, scan).catch((err) => {
        console.error(err)
        setError('Scan opslaan mislukt.')
      }),
    [uid],
  )

  return { count, addScan, error, ready: Boolean(uid) }
}
