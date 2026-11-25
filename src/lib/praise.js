// Complimenten en streak na een bevestigde scan.
// Bewust zonder React, zodat het los getest kan worden.

/** Kiest willekeurig een compliment, nooit hetzelfde als het vorige (als er keuze is). */
export function pickCompliment(list, previous, random = Math.random) {
  if (!list?.length) return null
  const options = list.length > 1 ? list.filter((text) => text !== previous) : list
  return options[Math.floor(random() * options.length)]
}

/** Nieuwe streak na een scan op tijdstip `now` (ms). Te lange pauze: opnieuw vanaf 1. */
export function nextStreak(streak, now, resetMs) {
  const continues = streak && now - streak.at <= resetMs
  return { count: continues ? streak.count + 1 : 1, at: now }
}

/** Extra boodschap bij een mijlpaal (bv. 3, 5, 10 en daarna elke 10), anders null. */
export function streakMessage(count, milestones) {
  const last = milestones[milestones.length - 1]
  const hit = milestones.includes(count) || (count > last && count % 10 === 0)
  return hit ? `${count} op een rij! 🔥` : null
}
