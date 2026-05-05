import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calcularPosiciones } from '@/lib/tournament'
import { getKnockoutRounds } from '@/lib/ranking'
import { Player, Match } from '@/lib/supabase'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { error } = await supabase.from('tournaments').update(body).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('tournaments').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { action, player_ids } = await req.json()

  if (action === 'setup') {
    const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', params.id).single()
    if (!tournament) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })

    await supabase.from('matches').delete().eq('tournament_id', params.id)
    await supabase.from('tournament_players').delete().eq('tournament_id', params.id)

    const shuffled = [...player_ids].sort(() => Math.random() - 0.5)
    const groups = Array.from({ length: tournament.num_groups }, (_, i) => String.fromCharCode(65 + i))
    const tpInserts = shuffled.map((pid: string, i: number) => ({
      tournament_id: params.id,
      player_id: pid,
      group_name: groups[Math.floor(i / tournament.players_per_group)],
    }))

    await supabase.from('tournament_players').insert(tpInserts)

    const matchInserts: object[] = []
    for (const group of groups) {
      const groupPlayerIds = tpInserts.filter((tp: { group_name: string }) => tp.group_name === group).map((tp: { player_id: string }) => tp.player_id)
      for (let i = 0; i < groupPlayerIds.length; i++) {
        for (let j = i + 1; j < groupPlayerIds.length; j++) {
          matchInserts.push({
            tournament_id: params.id,
            stage: 'group',
            group_name: group,
            player1_id: groupPlayerIds[i],
            player2_id: groupPlayerIds[j],
            played: false,
          })
        }
      }
    }

    await supabase.from('matches').insert(matchInserts)
    await supabase.from('tournaments').update({ status: 'active' }).eq('id', params.id)

    return NextResponse.json({ ok: true })
  }

  if (action === 'generate_knockouts') {
    const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', params.id).single()
    if (!tournament) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })

    const { data: tPlayers } = await supabase.from('tournament_players').select('*, player:player_id(*)').eq('tournament_id', params.id)
    const { data: groupMatches } = await supabase.from('matches').select('*').eq('tournament_id', params.id).eq('stage', 'group')

    if (!tPlayers || !groupMatches) return NextResponse.json({ error: 'Sin datos' }, { status: 400 })

    const groups = Array.from({ length: tournament.num_groups }, (_, i) => String.fromCharCode(65 + i))
    const standings: Record<string, Player[]> = {}

    for (const g of groups) {
      const gPlayers = tPlayers.filter((tp: { group_name: string }) => tp.group_name === g).map((tp: { player: Player }) => tp.player)
      const gMatches = groupMatches.filter((m: Match) => m.group_name === g)
      const sorted = calcularPosiciones(gPlayers, gMatches)
      standings[g] = sorted.slice(0, tournament.players_advancing).map(s => s.player)
    }

    const advancingPlayers: (Player | null)[] = []
    for (let pos = 0; pos < tournament.players_advancing; pos++) {
      for (const g of groups) {
        advancingPlayers.push(standings[g]?.[pos] ?? null)
      }
    }

    const knockoutRounds = getKnockoutRounds(tournament.num_groups, tournament.players_advancing)
    const firstRound = knockoutRounds[0]
    const totalFirst = advancingPlayers.length

    await supabase.from('matches').delete().eq('tournament_id', params.id).neq('stage', 'group')

    const firstRoundInserts = []
    for (let i = 0; i < totalFirst / 2; i++) {
      firstRoundInserts.push({
        tournament_id: params.id,
        stage: firstRound,
        match_position: i + 1,
        player1_id: advancingPlayers[i]?.id ?? null,
        player2_id: advancingPlayers[totalFirst - 1 - i]?.id ?? null,
        played: false,
      })
    }
    await supabase.from('matches').insert(firstRoundInserts)

    for (let r = 1; r < knockoutRounds.length; r++) {
      const round = knockoutRounds[r]
      const matchCount = Math.pow(2, knockoutRounds.length - 1 - r)
      const roundInserts = Array.from({ length: matchCount }, (_, i) => ({
        tournament_id: params.id,
        stage: round,
        match_position: i + 1,
        played: false,
      }))
      await supabase.from('matches').insert(roundInserts)
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
}
