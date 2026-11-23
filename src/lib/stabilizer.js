// Beslist of een reeks voorspellingen stabiel genoeg is om te tellen.
// Bewust zonder React of tfjs, zodat het los getest kan worden.

/**
 * @param {{threshold: number, stableFrames: number, backgroundLabel: string}} opts
 */
export function createStabilizer({ threshold, stableFrames, backgroundLabel }) {
  let label = null
  let count = 0

  /**
   * Verwerk de beste voorspelling van één frame.
   * @param {{className: string, probability: number}} top
   * @returns {{status: 'idle'|'detecting'|'confirmed', label: string|null, progress: number}}
   */
  function push(top) {
    const confident = top.probability >= threshold
    if (!confident || top.className === backgroundLabel) {
      label = null
      count = 0
      return { status: 'idle', label: null, progress: 0 }
    }

    if (top.className === label) count += 1
    else {
      label = top.className
      count = 1
    }

    if (count >= stableFrames) return { status: 'confirmed', label, progress: 1 }
    return { status: 'detecting', label, progress: count / stableFrames }
  }

  return { push }
}

/** Geeft de voorspelling met de hoogste zekerheid terug. */
export function topPrediction(predictions) {
  return predictions.reduce((best, p) => (p.probability > best.probability ? p : best))
}
