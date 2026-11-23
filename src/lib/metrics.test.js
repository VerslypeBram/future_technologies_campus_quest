import { describe, it, expect } from 'vitest'
import { evaluate } from './metrics.js'

const labels = ['PMD', 'Restafval']
const r = (expected, predicted) => ({ expected, predicted })

describe('evaluate', () => {
  it('berekent totale en per-klasse nauwkeurigheid', () => {
    const res = evaluate(labels, [r('PMD', 'PMD'), r('PMD', 'Restafval'), r('Restafval', 'Restafval'), r('PMD', 'PMD')])
    expect(res.accuracy).toBe(0.75)
    expect(res.perClass).toEqual([
      { label: 'PMD', correct: 2, total: 3, accuracy: 2 / 3 },
      { label: 'Restafval', correct: 1, total: 1, accuracy: 1 },
    ])
  })

  it('telt verwarringen in de matrix', () => {
    const res = evaluate(labels, [r('PMD', 'Restafval'), r('PMD', 'Restafval')])
    expect(res.matrix.PMD.Restafval).toBe(2)
    expect(res.matrix.PMD.PMD).toBe(0)
  })

  it('geeft null bij een klasse zonder testfoto\'s', () => {
    const res = evaluate(labels, [r('PMD', 'PMD')])
    expect(res.perClass[1].accuracy).toBeNull()
  })
})
