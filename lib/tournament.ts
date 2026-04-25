import { Player, Match, GroupStanding } from './supabase'

export function calcularPosiciones(players: Player[], matches: Match[]): GroupStanding[] {
  const standings: Record<string, GroupStanding> = {}

  for (const p of players) {
    standings[p.id] = {
      player: p,
      played: 0,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      points: 0,
    }
  }

  for (const m of matches) {
    if (!m.played || !m.player1_id || !m.player2_id) continue
    if (!standings[m.player1_id] || !standings[m.player2_id]) continue

    const s1 = standings[m.player1_id]
    const s2 = standings[m.player2_id]
    s1.played++
    s2.played++

    // Contar sets ganados por cada uno
    let sets1 = 0
    let sets2 = 0

    // Set 1
    if (m.set1_p1 != null && m.set1_p2 != null) {
      if (m.set1_p1 > m.set1_p2) sets1++
      else if (m.set1_p2 > m.set1_p1) sets2++
      s1.gamesWon += m.set1_p1
      s1.gamesLost += m.set1_p2
      s2.gamesWon += m.set1_p2
      s2.gamesLost += m.set1_p1
    }

    // Set 2
    if (m.set2_p1 != null && m.set2_p2 != null) {
      if (m.set2_p1 > m.set2_p2) sets1++
      else if (m.set2_p2 > m.set2_p1) sets2++
      s1.gamesWon += m.set2_p1
      s1.gamesLost += m.set2_p2
      s2.gamesWon += m.set2_p2
      s2.gamesLost += m.set2_p1
    }

    // Super tiebreak cuenta como set
    if (m.supertb_p1 != null && m.supertb_p2 != null) {
      if (m.supertb_p1 > m.supertb_p2) sets1++
      else if (m.supertb_p2 > m.supertb_p1) sets2++
    }

    s1.setsWon += sets1
    s1.setsLost += sets2
    s2.setsWon += sets2
    s2.setsLost += sets1

    if (m.winner_id === m.player1_id) {
      s1.wins++
      s1.points++
      s2.losses++
    } else if (m.winner_id === m.player2_id) {
      s2.wins++
      s2.points++
      s1.losses++
    }
  }

  const list = Object.values(standings)

  // Ordenar: puntos > head-to-head > diferencia sets > diferencia games
  list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points

    // Head to head entre los dos
    const h2h = matches.find(
      m => m.played && (
        (m.player1_id === a.player.id && m.player2_id === b.player.id) ||
        (m.player1_id === b.player.id && m.player2_id === a.player.id)
      )
    )
    if (h2h?.winner_id === a.player.id) return -1
    if (h2h?.winner_id === b.player.id) return 1

    // Diferencia de sets
    const setDiffA = a.setsWon - a.setsLost
    const setDiffB = b.setsWon - b.setsLost
    if (setDiffB !== setDiffA) return setDiffB - setDiffA

    // Diferencia de games
    const gameDiffA = a.gamesWon - a.gamesLost
    const gameDiffB = b.gamesWon - b.gamesLost
    return gameDiffB - gameDiffA
  })

  return list
}

export function generarCrucesCuartos(groupStandings: Record<string, GroupStanding[]>): {
  qf1: { p1: Player | null; p2: Player | null }
  qf2: { p1: Player | null; p2: Player | null }
  qf3: { p1: Player | null; p2: Player | null }
  qf4: { p1: Player | null; p2: Player | null }
} {
  const primerA = groupStandings['A']?.[0]?.player ?? null
  const segundoA = groupStandings['A']?.[1]?.player ?? null
  const primerB = groupStandings['B']?.[0]?.player ?? null
  const segundoB = groupStandings['B']?.[1]?.player ?? null
  const primerC = groupStandings['C']?.[0]?.player ?? null
  const segundoC = groupStandings['C']?.[1]?.player ?? null
  const primerD = groupStandings['D']?.[0]?.player ?? null
  const segundoD = groupStandings['D']?.[1]?.player ?? null

  return {
    qf1: { p1: primerA, p2: segundoB },
    qf2: { p1: primerC, p2: segundoD },
    qf3: { p1: primerB, p2: segundoA },
    qf4: { p1: primerD, p2: segundoC },
  }
}
