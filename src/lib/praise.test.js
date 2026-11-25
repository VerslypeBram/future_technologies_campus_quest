import { describe, it, expect } from 'vitest'
import { nextStreak, pickCompliment, streakMessage } from './praise.js'

describe('pickCompliment', () => {
  const list = ['A', 'B', 'C']

  it('herhaalt nooit het vorige compliment', () => {
    for (let i = 0; i < 50; i++) expect(pickCompliment(list, 'B')).not.toBe('B')
  })

  it('kiest uit de overige opties met de random-functie', () => {
    expect(pickCompliment(list, 'A', () => 0)).toBe('B')
    expect(pickCompliment(list, 'A', () => 0.99)).toBe('C')
  })

  it('geeft het enige compliment terug als er geen keuze is', () => {
    expect(pickCompliment(['A'], 'A')).toBe('A')
    expect(pickCompliment([], 'A')).toBeNull()
  })
})

describe('nextStreak', () => {
  it('begint bij 1 zonder vorige streak', () => {
    expect(nextStreak(null, 1000, 5000)).toEqual({ count: 1, at: 1000 })
  })

  it('telt op binnen de resettijd en begint opnieuw daarna', () => {
    expect(nextStreak({ count: 2, at: 0 }, 5000, 5000).count).toBe(3)
    expect(nextStreak({ count: 2, at: 0 }, 5001, 5000).count).toBe(1)
  })
})

describe('streakMessage', () => {
  const milestones = [3, 5, 10]

  it('geeft enkel een boodschap bij een mijlpaal', () => {
    expect(streakMessage(2, milestones)).toBeNull()
    expect(streakMessage(3, milestones)).toBe('3 op een rij! 🔥')
    expect(streakMessage(7, milestones)).toBeNull()
    expect(streakMessage(10, milestones)).not.toBeNull()
  })

  it('geeft daarna elke 10 een boodschap', () => {
    expect(streakMessage(15, milestones)).toBeNull()
    expect(streakMessage(20, milestones)).toBe('20 op een rij! 🔥')
  })
})
