import { useEffect, useRef, useState } from 'react'

// Vertaalt de fout van getUserMedia naar een duidelijke melding.
function cameraErrorMessage(err) {
  if (!window.isSecureContext) {
    return 'De camera werkt alleen via HTTPS (of op localhost).'
  }
  switch (err?.name) {
    case 'NotAllowedError':
      return 'Je hebt geen toestemming gegeven voor de camera. Sta dit toe in je browserinstellingen.'
    case 'NotFoundError':
      return 'Er is geen camera gevonden op dit toestel.'
    case 'NotReadableError':
      return 'De camera wordt al door een andere app gebruikt.'
    default:
      return 'De camera kon niet gestart worden.'
  }
}

// `children` wordt over het camerabeeld gelegd (kader en statusbalk).
export default function Camera({ onReady, children }) {
  const videoRef = useRef(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0) // ophogen = camera opnieuw starten

  useEffect(() => {
    let stream
    let cancelled = false

    async function start() {
      try {
        setError(null)
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // achtercamera op smartphone
          audio: false,
        })
        if (cancelled) return stream.getTracks().forEach((t) => t.stop())
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        onReady?.(videoRef.current)
      } catch (err) {
        if (!cancelled) setError(cameraErrorMessage(err))
      }
    }

    start()
    // Camera netjes afsluiten als de component verdwijnt.
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [onReady, attempt])

  if (error) {
    return (
      <div className="camera-error" role="alert">
        <h2>Camera niet beschikbaar</h2>
        <p>{error}</p>
        <button type="button" className="button" onClick={() => setAttempt((n) => n + 1)}>
          Opnieuw proberen
        </button>
      </div>
    )
  }

  // playsInline + muted zijn nodig voor iOS Safari, anders blijft het beeld zwart.
  return (
    <div className="camera">
      <video ref={videoRef} playsInline muted autoPlay aria-label="Livebeeld van de camera" />
      {children}
    </div>
  )
}
