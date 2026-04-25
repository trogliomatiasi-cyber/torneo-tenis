import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const [{ data: players }, { data: matches }] = await Promise.all([
    supabase.from('players').select('*').order('name'),
    supabase.from('matches').select('*, player1:player1_id(*), player2:player2_id(*), winner:winner_id(*)').order('created_at'),
  ])

  return NextResponse.json({ players: players ?? [], matches: matches ?? [] })
}
