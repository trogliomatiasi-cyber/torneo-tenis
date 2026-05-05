import { Tournament, Match, Player, RankingEntry } from './supabase'

export const ATP_POINTS: Record<string, Record<string, number>> = {
  '250':  { winner: 250, finalist: 150, sf: 90, qf: 45, r16: 20, r32: 10, group_win: 10 },
  '500':  { winner: 500, finalist: 300, sf: 180, qf: 90, r16: 45, r32: 20, group_win: 20 },
  '1000': { winner: 1000, finalist: 600, sf: 360, qf: 180, r16: 90, r32: 45, group_win: 40 },
  '2000': { winner: 2000, finalist: 1200, sf: 720, qf: 360, r16: 180, r32: 90, group_win: 80 },
}

export const ROUND_LABELS: Record<string, string> = {
  winner: 'Campeón',
  finalist: 'Finalista',
  sf: 'Semifinal',
  qf: 'Cuartos',
  r16: 'Octavos',
  r32: 'R32',
  group: 'Fase de Grupos',
}

export const CATEGORY_COLORS: Record<string, string> = {
  '250': 'bg-slate-100 text-slate-700 border border-slate-300',
  '500': 'bg-blue-100 text-blue-700 border border-blue-300',
  '1000': 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  '2000': 'bg-purple-100 text-purple-700 border border-purple-300',
}

export const CATEGORY_BADGE: Record<string, string> = {
  '250': 'ATP 250',
  '500': 'ATP 500',
  '1000': 'ATP 1000',
  '2000': 'ATP 2000',
}

type TournamentWithMatches = Tournament & { matches: Match[] }

export function calcularRanking(
  tournaments: TournamentWithMatches[],
  allPlayers: Player[]
): RankingEntry[] {
  const points: Record<string, number> = {}
  const tournamentsPlayed: Record<string, number> = {}
  const bestResult: Record<string, string> = {}

  for (const t of tournaments) {
    if (t.status !== 'completed' && t.status !== 'active') continue
    const pts = ATP_POINTS[t.category]
    const matches = t.matches

    for (const m of matches) {
      if (!m.played || !m.winner_id || m.stage !== 'group') continue
      points[m.winner_id] = (points[m.winner_id] ?? 0) + pts.group_win
    }

    const knockoutStages = ['r32', 'r16', 'qf', 'sf', 'final']
    for (const stage of knockoutStages) {
      const stageMatches = matches.filter(m => m.stage === stage && m.played && m.winner_id)
      for (const m of stageMatches) {
        const loserId = m.player1_id === m.winner_id ? m.player2_id : m.player1_id
        if (!loserId) continue
        const roundKey = stage === 'final' ? 'finalist' : stage
        const roundPts = pts[roundKey] ?? 0
        points[loserId] = (points[loserId] ?? 0) + roundPts
        if (!bestResult[loserId] || compareBestResult(roundKey, bestResult[loserId])) {
          bestResult[loserId] = roundKey
        }
        tournamentsPlayed[loserId] = (tournamentsPlayed[loserId] ?? 0) + 1
      }
    }

    const finalMatch = matches.find(m => m.stage === 'final' && m.played && m.winner_id)
    if (finalMatch?.winner_id) {
      points[finalMatch.winner_id] = (points[finalMatch.winner_id] ?? 0) + pts.winner
      bestResult[finalMatch.winner_id] = 'winner'
      tournamentsPlayed[finalMatch.winner_id] = (tournamentsPlayed[finalMatch.winner_id] ?? 0) + 1
    }
  }

  return allPlayers
    .filter(p => (points[p.id] ?? 0) > 0)
    .map(p => ({
      player: p,
      totalPoints: points[p.id] ?? 0,
      tournaments: tournamentsPlayed[p.id] ?? 0,
      bestResult: bestResult[p.id] ?? 'group',
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
}

const ROUND_ORDER = ['winner', 'finalist', 'sf', 'qf', 'r16', 'r32', 'group']

function compareBestResult(newRound: string, currentBest: string): boolean {
  return ROUND_ORDER.indexOf(newRound) < ROUND_ORDER.indexOf(currentBest)
}

export function getKnockoutRounds(numGroups: number, playersAdvancing: number): string[] {
  const total = numGroups * playersAdvancing
  if (total <= 2) return ['final']
  if (total <= 4) return ['sf', 'final']
  if (total <= 8) return ['qf', 'sf', 'final']
  if (total <= 16) return ['r16', 'qf', 'sf', 'final']
  return ['r32', 'r16', 'qf', 'sf', 'final']
}

export const STAGE_LABELS: Record<string, string> = {
  group: 'Fase de Grupos',
  r32: 'Ronda de 32',
  r16: 'Octavos de Final',
  qf: 'Cuartos de Final',
  sf: 'Semifinales',
  final: 'Final',
}
