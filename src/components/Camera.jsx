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

export default function Camera({ onReady }) {
  const videoRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let stream
    let cancelled = false

    async function start() {
      try {
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
  }, [onReady])

  if (error) return <p role="alert">{error}</p>

  // playsInline + muted zijn nodig voor iOS Safari, anders blijft het beeld zwart.
  return <video ref={videoRef} playsInline muted autoPlay style={{ width: '100%', borderRadius: 12 }} />
}
