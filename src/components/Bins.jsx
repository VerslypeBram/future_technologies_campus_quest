import { useEffect, useRef, useState } from 'react'
import { GAME, WASTE_CLASSES } from '../config.js'

/**
 * Neemt een vierkante momentopname van het deel van het camerabeeld binnen het scankader.
 * Het beeld blijft in de browser (data-URL) en wordt nergens opgeslagen of verstuurd.
 */
export function takeSnapshot(video, frameEl, size = GAME.snapshotSize) {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh) return null
  const v = video.getBoundingClientRect()
  const f = frameEl?.getBoundingClientRect() ?? v
  // De video gebruikt object-fit: cover, dus schermcoördinaten omrekenen naar videopixels.
  const scale = Math.max(v.width / vw, v.height / vh)
  const offsetX = (v.width - vw * scale) / 2
  const offsetY = (v.height - vh * scale) / 2
  const sx = Math.max(0, (f.left - v.left - offsetX) / scale)
  const sy = Math.max(0, (f.top - v.top - offsetY) / scale)
  const side = Math.min(f.width / scale, vw - sx, vh - sy)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  canvas.getContext('2d').drawImage(video, sx, sy, side, side, 0, 0, size, size)
  return canvas.toDataURL('image/jpeg', 0.8)
}

// Keyframes voor een parabool van (0,0) naar (dx,dy) met een boog van `arc` px omhoog.
function arcKeyframes(dx, dy, arc, steps = 12) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    const x = dx * t
    const y = dy * t - arc * 4 * t * (1 - t)
    const scale = 1 - 0.7 * t
    return { transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${t * 360}deg)` }
  })
}

const FLY_SIZE = 72

/**
 * Drie vuilbakken. `active` licht de bak van de kandidaat-klasse op tijdens het herkennen.
 * `toss` ({ id, label, image }) laat het item vanuit het scankader in de juiste bak vliegen.
 * `onLand(id)` wordt aangeroepen zodra het item in de bak landt (of meteen zonder animatie).
 */
export default function Bins({ active, toss, sourceRef, onLand }) {
  const binRefs = useRef({})
  const flyRef = useRef(null)
  const [hit, setHit] = useState(null)

  // Worp starten bij een nieuwe toss.
  useEffect(() => {
    if (!toss) return
    const bin = binRefs.current[toss.label]
    const fly = flyRef.current
    const from = sourceRef?.current?.getBoundingClientRect()
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!bin || !fly || !from || reduceMotion || !fly.animate) {
      setHit(toss)
      onLand?.(toss.id)
      return
    }

    const to = bin.querySelector('.bin-body').getBoundingClientRect()
    const startX = from.left + from.width / 2 - FLY_SIZE / 2
    const startY = from.top + from.height / 2 - FLY_SIZE / 2
    const dx = to.left + to.width / 2 - FLY_SIZE / 2 - startX
    const dy = to.top + to.height * 0.2 - FLY_SIZE / 2 - startY
    fly.style.left = `${startX}px`
    fly.style.top = `${startY}px`
    fly.hidden = false

    const anim = fly.animate(arcKeyframes(dx, dy, 120), {
      duration: GAME.flightMs,
      easing: 'cubic-bezier(0.35, 0, 0.65, 1)',
    })
    anim.onfinish = () => {
      fly.hidden = true
      setHit(toss)
      onLand?.(toss.id)
    }
    return () => {
      anim.cancel()
      fly.hidden = true
    }
  }, [toss, sourceRef, onLand])

  // Treffer-animatie na een korte tijd weer weghalen.
  useEffect(() => {
    if (!hit) return
    const id = setTimeout(() => setHit(null), 1200)
    return () => clearTimeout(id)
  }, [hit])

  const flyColor = toss ? WASTE_CLASSES[toss.label]?.color : undefined

  return (
    <div className="bins" role="list" aria-label="Vuilbakken">
      {Object.entries(WASTE_CLASSES).map(([label, { short, color }]) => {
        const isHit = hit?.label === label
        const className = ['bin', active === label && 'bin-active', isHit && 'bin-hit']
          .filter(Boolean)
          .join(' ')
        return (
          <div
            key={label}
            role="listitem"
            className={className}
            style={{ '--bin-color': color }}
            ref={(el) => (binRefs.current[label] = el)}
            aria-label={isHit ? `${short}: goed gesorteerd` : short}
          >
            <span className="bin-lid" aria-hidden="true" />
            <span className="bin-body" aria-hidden="true" />
            <span className="bin-name">{short}</span>
            {isHit && (
              <span key={hit.id} className="bin-plus" aria-hidden="true">
                ✓
              </span>
            )}
          </div>
        )
      })}

      <div ref={flyRef} className="bin-fly" hidden aria-hidden="true" style={{ background: flyColor }}>
        {toss?.image && <img src={toss.image} alt="" />}
      </div>
    </div>
  )
}
