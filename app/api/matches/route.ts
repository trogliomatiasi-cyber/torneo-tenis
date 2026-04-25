import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, set1_p1, set1_p2, set2_p1, set2_p2, supertb_p1, supertb_p2 } = body

  // Determinar ganador
  let sets1 = 0
  let sets2 = 0

  if (set1_p1 > set1_p2) sets1++; else if (set1_p2 > set1_p1) sets2++
  if (set2_p1 > set2_p2) sets1++; else if (set2_p2 > set2_p1) sets2++

  if (sets1 === 1 && sets2 === 1) {
    if (supertb_p1 > supertb_p2) sets1++; else sets2++
  }

  const { data: match } = await supabase.from('matches').select('player1_id, player2_id').eq('id', id).single()
  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })

  const winner_id = sets1 > sets2 ? match.player1_id : match.player2_id

  const { error } = await supabase.from('matches').update({
    set1_p1, set1_p2,
    set2_p1, set2_p2,
    supertb_p1: (sets1 === 1 && sets2 === 1) ? supertb_p1 : null,
    supertb_p2: (sets1 === 1 && sets2 === 1) ? supertb_p2 : null,
    winner_id,
    played: true,
  }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, winner_id })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()

  const { error } = await supabase.from('matches').update({
    set1_p1: null, set1_p2: null,
    set2_p1: null, set2_p2: null,
    supertb_p1: null, supertb_p2: null,
    winner_id: null,
    played: false,
  }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
