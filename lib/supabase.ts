import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Player = {
  id: string
  name: string
  created_at: string
}

export type Tournament = {
  id: string
  name: string
  category: '250' | '500' | '1000' | '2000'
  status: 'upcoming' | 'active' | 'completed'
  start_date: string | null
  num_groups: number
  players_per_group: number
  players_advancing: number
  created_at: string
}

export type TournamentPlayer = {
  id: string
  tournament_id: string
  player_id: string
  group_name: string | null
  player?: Player
}

export type Match = {
  id: string
  tournament_id: string
  stage: string
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

export type RankingEntry = {
  player: Player
  totalPoints: number
  tournaments: number
  bestResult: string
}
