import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getKnockoutRounds } from '@/lib/ranking'

export async function PATCH(req: NextRequest) {
  const { id, set1_p1, set1_p2, set2_p1, set2_p2, supertb_p1, supertb_p2 } = await req.json()

  let sets1 = 0, sets2 = 0
  if (set1_p1 > set1_p2) sets1++; else if (set1_p2 > set1_p1) sets2++
  if (set2_p1 > set2_p2) sets1++; else if (set2_p2 > set2_p1) sets2++
  if (sets1 === 1 && sets2 === 1) {
    if (supertb_p1 > supertb_p2) sets1++; else sets2++
  }

  const { data: match } = await supabase.from('matches').select('player1_id, player2_id, stage, match_position, tournament_id').eq('id', id).single()
  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })

  const winner_id = sets1 > sets2 ? match.player1_id : match.player2_id
  const needsTB = sets1 === 1 && sets2 === 1

  await supabase.from('matches').update({
    set1_p1, set1_p2, set2_p1, set2_p2,
    supertb_p1: needsTB ? supertb_p1 : null,
    supertb_p2: needsTB ? supertb_p2 : null,
    winner_id, played: true,
  }).eq('id', id)

  if (match.stage !== 'group') {
    const { data: tournament } = await supabase.from('tournaments').select('num_groups, players_advancing').eq('id', match.tournament_id).single()
    if (tournament) {
      const rounds = getKnockoutRounds(tournament.num_groups, tournament.players_advancing)
      const currentIdx = rounds.indexOf(match.stage)
      if (currentIdx >= 0 && currentIdx < rounds.length - 1) {
        const nextRound = rounds[currentIdx + 1]
        const nextMatchPosition = Math.ceil(match.match_position / 2)
        const isOdd = match.match_position % 2 === 1

        const { data: nextMatch } = await supabase.from('matches')
          .select('id, player1_id, player2_id')
          .eq('tournament_id', match.tournament_id)
          .eq('stage', nextRound)
          .eq('match_position', nextMatchPosition)
          .single()

        if (nextMatch) {
          const field = isOdd ? 'player1_id' : 'player2_id'
          await supabase.from('matches').update({ [field]: winner_id }).eq('id', nextMatch.id)
        }
      }

      if (match.stage === 'final') {
        await supabase.from('tournaments').update({ status: 'completed' }).eq('id', match.tournament_id)
      }
    }
  }

  return NextResponse.json({ ok: true, winner_id })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await supabase.from('matches').update({
    set1_p1: null, set1_p2: null, set2_p1: null, set2_p2: null,
    supertb_p1: null, supertb_p2: null, winner_id: null, played: false,
  }).eq('id', id)
  return NextResponse.json({ ok: true })
}
