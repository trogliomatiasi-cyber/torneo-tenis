import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { names } = await req.json() as { names: string[] }

  const { data: existingMatches } = await supabase.from('matches').select('id')
  if (existingMatches && existingMatches.length > 0) {
    await supabase.from('matches').delete().in('id', existingMatches.map((m: {id: string}) => m.id))
  }

  const { data: existingPlayers } = await supabase.from('players').select('id')
  if (existingPlayers && existingPlayers.length > 0) {
    await supabase.from('players').delete().in('id', existingPlayers.map((p: {id: string}) => p.id))
  }

  const shuffled = [...names].sort(() => Math.random() - 0.5)
  const groups = ['A', 'B', 'C', 'D']
  const playersToInsert = shuffled.map((name, i) => ({
    name: name.trim(),
    group_name: groups[Math.floor(i / 3)],
  }))

  const { data: players, error } = await supabase
    .from('players')
    .insert(playersToInsert)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const matchesToInsert: {
    stage: string
    group_name: string
    player1_id: string
    player2_id: string
    played: boolean
  }[] = []

  for (const group of groups) {
    const groupPlayers = players!.filter((p: {group_name: string}) => p.group_name === group)
    for (let i = 0; i < groupPlayers.length; i++) {
      for (let j = i + 1; j < groupPlayers.length; j++) {
        matchesToInsert.push({
          stage: 'group',
          group_name: group,
          player1_id: groupPlayers[i].id,
          player2_id: groupPlayers[j].id,
          played: false,
        })
      }
    }
  }

  await supabase.from('matches').insert(matchesToInsert)

  return NextResponse.json({ players })
}
