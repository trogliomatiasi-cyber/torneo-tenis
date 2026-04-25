import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { names } = await req.json() as { names: string[] }

  // Borrar todo lo anterior y arrancar de cero
  await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Mezclar aleatoriamente
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

  // Generar partidos de grupos (todos contra todos dentro de cada grupo)
  const matchesToInsert: {
    stage: string
    group_name: string
    player1_id: string
    player2_id: string
    played: boolean
  }[] = []

  for (const group of groups) {
    const groupPlayers = players!.filter(p => p.group_name === group)
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
