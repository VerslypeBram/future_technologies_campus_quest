import { describe, it, expect } from 'vitest'
import { createStabilizer, topPrediction } from './stabilizer.js'

const opts = { threshold: 0.9, stableFrames: 3, resetFrames: 2, backgroundLabel: 'Geen verpakking' }
const p = (className, probability = 0.95) => ({ className, probability })
const bg = () => p('Geen verpakking', 0.99)

describe('stabilizer', () => {
  it('bevestigt pas na N frames na elkaar boven de drempel', () => {
    const s = createStabilizer(opts)
    expect(s.push(p('PMD')).status).toBe('detecting')
    expect(s.push(p('PMD')).status).toBe('detecting')
    expect(s.push(p('PMD'))).toEqual({ status: 'confirmed', label: 'PMD', progress: 1 })
  })

  it('begint opnieuw bij een frame onder de drempel', () => {
    const s = createStabilizer(opts)
    s.push(p('PMD'))
    s.push(p('PMD'))
    expect(s.push(p('PMD', 0.89)).status).toBe('idle')
    expect(s.push(p('PMD')).progress).toBeCloseTo(1 / 3)
  })

  it('begint opnieuw als het label wisselt', () => {
    const s = createStabilizer(opts)
    s.push(p('PMD'))
    s.push(p('PMD'))
    expect(s.push(p('Restafval'))).toMatchObject({ status: 'detecting', label: 'Restafval' })
  })

  it('geeft nooit advies bij de achtergrondklasse', () => {
    const s = createStabilizer(opts)
    for (let i = 0; i < 5; i++) expect(s.push(bg()).status).toBe('idle')
  })

  it('bevestigt hetzelfde object maar één keer zolang het voor de camera blijft', () => {
    const s = createStabilizer(opts)
    ;[1, 2, 3].forEach(() => s.push(p('PMD')))
    for (let i = 0; i < 10; i++) expect(s.push(p('PMD')).status).toBe('locked')
  })

  it('vrijgegeven pas na genoeg frames lege achtergrond na elkaar', () => {
    const s = createStabilizer(opts)
    ;[1, 2, 3].forEach(() => s.push(p('PMD')))
    expect(s.push(bg()).status).toBe('locked')
    expect(s.push(p('PMD')).status).toBe('locked') // onderbroken -> opnieuw tellen
    expect(s.push(bg()).status).toBe('locked')
    expect(s.push(bg()).status).toBe('idle')
    expect(s.push(p('PMD')).status).toBe('detecting')
  })

  it('topPrediction kiest de hoogste zekerheid', () => {
    expect(topPrediction([p('PMD', 0.2), p('Restafval', 0.7), p('Papier/Karton', 0.1)]).className).toBe('Restafval')
  })
})
