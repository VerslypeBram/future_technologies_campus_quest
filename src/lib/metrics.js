// Berekent nauwkeurigheid en verwarringsmatrix uit testresultaten.
// Zonder React of tfjs, zodat het los getest kan worden.

/**
 * @param {string[]} labels alle klassen
 * @param {{expected: string, predicted: string}[]} results één item per testfoto
 */
export function evaluate(labels, results) {
  // matrix[verwacht][voorspeld] = aantal
  const matrix = Object.fromEntries(labels.map((a) => [a, Object.fromEntries(labels.map((b) => [b, 0]))]))
  for (const { expected, predicted } of results) matrix[expected][predicted] += 1

  const perClass = labels.map((label) => {
    const total = labels.reduce((sum, p) => sum + matrix[label][p], 0)
    const correct = matrix[label][label]
    return { label, correct, total, accuracy: total ? correct / total : null }
  })

  const correct = perClass.reduce((s, c) => s + c.correct, 0)
  const total = results.length
  return { matrix, perClass, correct, total, accuracy: total ? correct / total : null }
}
