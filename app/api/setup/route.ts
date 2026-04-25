import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calcularPosiciones } from '@/lib/tournament'
import { Player, Match } from '@/lib/supabase'

// Genera los cruces de cuartos de final basándose en las posiciones de grupos
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === 'generate_knockouts') {
    const [{ data: players }, { data: matches }] = await Promise.all([
      supabase.from('players').select('*'),
      supabase.from('matches').select('*').eq('stage', 'group'),
    ])

    if (!players || !matches) return NextResponse.json({ error: 'Sin datos' }, { status: 400 })

    const groups = ['A', 'B', 'C', 'D']
    const standings: Record<string, ReturnType<typeof calcularPosiciones>> = {}

    for (const g of groups) {
      const gPlayers = players.filter((p: Player) => p.group_name === g)
      const gMatches = matches.filter((m: Match) => m.group_name === g)
      standings[g] = calcularPosiciones(gPlayers, gMatches)
    }

    // Cruces: 1A vs 2B, 1C vs 2D, 1B vs 2A, 1D vs 2C
    const qfMatchups = [
      { pos: 1, p1: standings['A']?.[0]?.player, p2: standings['B']?.[1]?.player },
      { pos: 2, p1: standings['C']?.[0]?.player, p2: standings['D']?.[1]?.player },
      { pos: 3, p1: standings['B']?.[0]?.player, p2: standings['A']?.[1]?.player },
      { pos: 4, p1: standings['D']?.[0]?.player, p2: standings['C']?.[1]?.player },
    ]

    // Borrar knockouts existentes
    await supabase.from('matches').delete().in('stage', ['qf', 'sf', 'final'])

    // Insertar cuartos
    const qfInserts = qfMatchups.map(q => ({
      stage: 'qf',
      match_position: q.pos,
      player1_id: q.p1?.id ?? null,
      player2_id: q.p2?.id ?? null,
      played: false,
      group_name: null,
    }))

    await supabase.from('matches').insert(qfInserts)

    // Insertar semis y final vacías (se llenan cuando avancen jugadores)
    await supabase.from('matches').insert([
      { stage: 'sf', match_position: 1, played: false, group_name: null },
      { stage: 'sf', match_position: 2, played: false, group_name: null },
      { stage: 'final', match_position: 1, played: false, group_name: null },
    ])

    return NextResponse.json({ ok: true, standings })
  }

  if (action === 'advance_winner') {
    const { match_id } = body
    const { data: match } = await supabase.from('matches').select('*').eq('id', match_id).single()
    if (!match || !match.winner_id) return NextResponse.json({ error: 'Sin ganador' }, { status: 400 })

    if (match.stage === 'qf') {
      const sfMatchPosition = match.match_position <= 2 ? 1 : 2
      const sfMatch = await supabase.from('matches').select('*').eq('stage', 'sf').eq('match_position', sfMatchPosition).single()
      if (sfMatch.data) {
        const field = match.match_position % 2 === 1 ? 'player1_id' : 'player2_id'
        await supabase.from('matches').update({ [field]: match.winner_id }).eq('id', sfMatch.data.id)
      }
    }

    if (match.stage === 'sf') {
      const finalMatch = await supabase.from('matches').select('*').eq('stage', 'final').eq('match_position', 1).single()
      if (finalMatch.data) {
        const field = match.match_position === 1 ? 'player1_id' : 'player2_id'
        await supabase.from('matches').update({ [field]: match.winner_id }).eq('id', finalMatch.data.id)
      }
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
}
