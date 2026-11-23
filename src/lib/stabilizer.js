// Beslist of een reeks voorspellingen stabiel genoeg is om te tellen.
// Bewust zonder React of tfjs, zodat het los getest kan worden.

/**
 * @param {{threshold: number, stableFrames: number, resetFrames: number, backgroundLabel: string}} opts
 */
export function createStabilizer({ threshold, stableFrames, resetFrames, backgroundLabel }) {
  let label = null
  let count = 0
  // Reset-regel: na een bevestiging is de scanner "vergrendeld" tot de camera
  // `resetFrames` frames na elkaar zeker de lege achtergrond ziet.
  let locked = false
  let backgroundCount = 0

  /**
   * Verwerk de beste voorspelling van één frame.
   * @param {{className: string, probability: number}} top
   * @returns {{status: 'idle'|'detecting'|'confirmed'|'locked', label: string|null, progress: number}}
   */
  function push(top) {
    const confident = top.probability >= threshold
    const isBackground = top.className === backgroundLabel

    if (locked) {
      backgroundCount = confident && isBackground ? backgroundCount + 1 : 0
      if (backgroundCount >= resetFrames) {
        locked = false
        backgroundCount = 0
        return { status: 'idle', label: null, progress: 0 }
      }
      return { status: 'locked', label: null, progress: backgroundCount / resetFrames }
    }

    if (!confident || isBackground) {
      label = null
      count = 0
      return { status: 'idle', label: null, progress: 0 }
    }

    if (top.className === label) count += 1
    else {
      label = top.className
      count = 1
    }

    if (count >= stableFrames) {
      const confirmed = label
      label = null
      count = 0
      locked = true
      return { status: 'confirmed', label: confirmed, progress: 1 }
    }
    return { status: 'detecting', label, progress: count / stableFrames }
  }

  return { push }
}

/** Geeft de voorspelling met de hoogste zekerheid terug. */
export function topPrediction(predictions) {
  return predictions.reduce((best, p) => (p.probability > best.probability ? p : best))
}
