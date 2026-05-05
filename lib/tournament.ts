import { Player, Match, GroupStanding } from './supabase'

export function calcularPosiciones(players: Player[], matches: Match[]): GroupStanding[] {
  const standings: Record<string, GroupStanding> = {}

  for (const p of players) {
    standings[p.id] = { player: p, played: 0, wins: 0, losses: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0, points: 0 }
  }

  for (const m of matches) {
    if (!m.played || !m.player1_id || !m.player2_id) continue
    if (!standings[m.player1_id] || !standings[m.player2_id]) continue

    const s1 = standings[m.player1_id]
    const s2 = standings[m.player2_id]
    s1.played++; s2.played++

    let sets1 = 0, sets2 = 0

    if (m.set1_p1 != null && m.set1_p2 != null) {
      if (m.set1_p1 > m.set1_p2) sets1++; else if (m.set1_p2 > m.set1_p1) sets2++
      s1.gamesWon += m.set1_p1; s1.gamesLost += m.set1_p2
      s2.gamesWon += m.set1_p2; s2.gamesLost += m.set1_p1
    }
    if (m.set2_p1 != null && m.set2_p2 != null) {
      if (m.set2_p1 > m.set2_p2) sets1++; else if (m.set2_p2 > m.set2_p1) sets2++
      s1.gamesWon += m.set2_p1; s1.gamesLost += m.set2_p2
      s2.gamesWon += m.set2_p2; s2.gamesLost += m.set2_p1
    }
    if (m.supertb_p1 != null && m.supertb_p2 != null) {
      if (m.supertb_p1 > m.supertb_p2) sets1++; else if (m.supertb_p2 > m.supertb_p1) sets2++
    }

    s1.setsWon += sets1; s1.setsLost += sets2
    s2.setsWon += sets2; s2.setsLost += sets1

    if (m.winner_id === m.player1_id) { s1.wins++; s1.points++; s2.losses++ }
    else if (m.winner_id === m.player2_id) { s2.wins++; s2.points++; s1.losses++ }
  }

  const list = Object.values(standings)
  list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const h2h = matches.find(m => m.played && (
      (m.player1_id === a.player.id && m.player2_id === b.player.id) ||
      (m.player1_id === b.player.id && m.player2_id === a.player.id)
    ))
    if (h2h?.winner_id === a.player.id) return -1
    if (h2h?.winner_id === b.player.id) return 1
    const setDiff = (b.setsWon - b.setsLost) - (a.setsWon - a.setsLost)
    if (setDiff !== 0) return setDiff
    return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost)
  })

  return list
}
