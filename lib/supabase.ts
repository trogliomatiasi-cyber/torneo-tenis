import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Player = {
  id: string
  name: string
  group_name: string | null
  created_at: string
}

export type Match = {
  id: string
  stage: 'group' | 'qf' | 'sf' | 'final'
  group_name: string | null
  match_position: number | null
  player1_id: string | null
  player2_id: string | null
  set1_p1: number | null
  set1_p2: number | null
  set2_p1: number | null
  set2_p2: number | null
  supertb_p1: number | null
  supertb_p2: number | null
  winner_id: string | null
  played: boolean
  player1?: Player
  player2?: Player
  winner?: Player
}

export type GroupStanding = {
  player: Player
  played: number
  wins: number
  losses: number
  setsWon: number
  setsLost: number
  gamesWon: number
  gamesLost: number
  points: number
}
