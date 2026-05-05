import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase.from('tournaments').insert({
    name: body.name,
    category: body.category,
    status: 'upcoming',
    start_date: body.start_date || null,
    num_groups: body.num_groups,
    players_per_group: body.players_per_group,
    players_advancing: body.players_advancing,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
