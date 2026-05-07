'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, Tournament, Player, Match, TournamentPlayer } from '@/lib/supabase'
import { calcularPosiciones } from '@/lib/tournament'
import { CATEGORY_BADGE, CATEGORY_COLORS, STAGE_LABELS, ATP_POINTS } from '@/lib/ranking'

type TournamentData = Tournament & {
  tournament_players: (TournamentPlayer & { player: Player })[]
  matches: Match[]
}

function ScoreDisplay({ match, players }: { match: Match; players: Record<string, Player> }) {
  const p1 = players[match.player1_id ?? '']
  const p2 = players[match.player2_id ?? '']

  if (!p1 && !p2) return <div className="text-gray-400 text-sm text-center">Pendiente</div>

  const isWinner1 = match.winner_id === match.player1_id
  const isWinner2 = match.winner_id === match.player2_id

  return (
    <div className="w-full">
      {[
        { player: p1, isWinner: isWinner1, s1: match.set1_p1, s2: match.set2_p1, tb: match.supertb_p1 },
        { player: p2, isWinner: isWinner2, s1: match.set1_p2, s2: match.set2_p2, tb: match.supertb_p2 },
      ].map((row, i) => (
        <div key={i} className={`flex items-center justify-between py-1 px-2 rounded ${row.isWinner ? 'bg-emerald-50' : ''}`}>
          <span className={`text-sm font-medium truncate flex-1 ${row.isWinner ? 'font-bold text-emerald-700' : 'text-gray-600'}`}>
            {row.isWinner && '🏆 '}{row.player?.name ?? 'TBD'}
          </span>
          {match.played && (
            <div className="flex gap-1 ml-2 text-sm font-mono">
              <span className={`w-5 text-center ${row.isWinner ? 'font-bold' : 'text-gray-400'}`}>{row.s1 ?? '-'}</span>
              <span className={`w-5 text-center ${row.isWinner ? 'font-bold' : 'text-gray-400'}`}>{row.s2 ?? '-'}</span>
              {(match.supertb_p1 != null) && (
                <span className={`w-6 text-center text-xs ${row.isWinner ? 'font-bold' : 'text-gray-400'}`}>[{row.tb}]</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function TorneoPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<TournamentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: tp }, { data: ms }] = await Promise.all([
        supabase.from('tournaments').select('*').eq('id', id).single(),
        supabase.from('tournament_players').select('*, player:player_id(*)').eq('tournament_id', id),
        supabase.from('matches').select('*').eq('tournament_id', id),
      ])
      if (!t) { setLoading(false); return }
      setData({ ...t, tournament_players: tp ?? [], matches: ms ?? [] })
      setLoading(false)
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F7F4]">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F7F4]">
      <p className="text-gray-500">Torneo no encontrado</p>
    </div>
  )

  const playersMap: Record<string, Player> = {}
  data.tournament_players.forEach(tp => { if (tp.player) playersMap[tp.player.id] = tp.player })

  const groups = Array.from(new Set(data.tournament_players.map(tp => tp.group_name).filter(Boolean))) as string[]
  groups.sort()

  const groupMatches = data.matches.filter(m => m.stage === 'group')
  const knockoutMatches = data.matches.filter(m => m.stage !== 'group')
  const knockoutStages = Array.from(new Set(knockoutMatches.map(m => m.stage)))
  const stageOrder = ['r32', 'r16', 'qf', 'sf', 'final']
  knockoutStages.sort((a, b) => stageOrder.indexOf(a) - stageOrder.indexOf(b))

  const pts = ATP_POINTS[data.category]
  const finalMatch = data.matches.find(m => m.stage === 'final' && m.played && m.winner_id)
  const champion = finalMatch ? playersMap[finalMatch.winner_id!] : null

  const STATUS_LABEL: Record<string, string> = { upcoming: 'Próximamente', active: 'En curso', completed: 'Finalizado' }
  const STATUS_COLOR: Record<string, string> = { upcoming: 'bg-gray-100 text-gray-600', active: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700' }

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      <header className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/" className="text-emerald-300 text-sm hover:text-white transition mb-3 inline-block">← ATP Castelar</Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[data.category]}`}>
                  {CATEGORY_BADGE[data.category]}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[data.status]}`}>
                  {STATUS_LABEL[data.status]}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold">{data.name}</h1>
              {data.start_date && (
                <p className="text-emerald-300 text-sm mt-1">
                  {new Date(data.start_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {champion && (
                <p className="text-yellow-300 font-bold mt-2">🏆 Campeón: {champion.name}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="bg-white rounded-2xl shadow p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Puntos ATP · {CATEGORY_BADGE[data.category]}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
            {[
              ['Campeón', pts.winner], ['Finalista', pts.finalist], ['SF', pts.sf],
              ['QF', pts.qf], ['R16', pts.r16], ['R32', pts.r32], ['Grupo', pts.group_win],
            ].map(([label, val]) => (
              <div key={label} className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-400 mb-1">{label}</div>
                <div className="font-bold text-emerald-700 text-base">{val}</div>
              </div>
            ))}
          </div>
        </section>

        {groups.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#1B4332] mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-emerald-500 rounded-full inline-block" />
              Fase de Grupos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map(g => {
                const gPlayers = data.tournament_players.filter(tp => tp.group_name === g).map(tp => tp.player).filter(Boolean) as Player[]
                const gMatches = groupMatches.filter(m => m.group_name === g)
                const standings = calcularPosiciones(gPlayers, gMatches)
                const advancing = data.players_advancing

                return (
                  <div key={g} className="bg-white rounded-2xl shadow overflow-hidden">
                    <div className="bg-emerald-700 text-white px-4 py-2 font-bold text-sm">Grupo {g}</div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-400 text-xs uppercase">
                          <th className="px-4 py-2 text-left">Jugador</th>
                          <th className="px-3 py-2 text-center">J</th>
                          <th className="px-3 py-2 text-center">G</th>
                          <th className="px-3 py-2 text-center">P</th>
                          <th className="px-3 py-2 text-center">Sets</th>
                          <th className="px-3 py-2 text-center">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((s, i) => (
                          <tr key={s.player.id} className={`border-t ${i < advancing ? 'bg-emerald-50' : ''}`}>
                            <td className="px-4 py-2 font-medium">
                              {i < advancing
                                ? <span className="inline-block w-4 h-4 bg-emerald-500 text-white text-xs rounded-full text-center leading-4 mr-1">{i + 1}</span>
                                : <span className="inline-block w-4 h-4 bg-gray-200 text-gray-500 text-xs rounded-full text-center leading-4 mr-1">{i + 1}</span>
                              }
                              {s.player.name}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-500">{s.played}</td>
                            <td className="px-3 py-2 text-center text-green-600 font-medium">{s.wins}</td>
                            <td className="px-3 py-2 text-center text-red-500">{s.losses}</td>
                            <td className="px-3 py-2 text-center text-gray-500">{s.setsWon}/{s.setsLost}</td>
                            <td className="px-3 py-2 text-center font-bold text-emerald-700">{s.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="border-t divide-y">
                      {gMatches.map(m => (
                        <div key={m.id} className="px-4 py-2">
                          <ScoreDisplay match={m} players={playersMap} />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {knockoutStages.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#1B4332] mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-emerald-500 rounded-full inline-block" />
              Fase Eliminatoria
            </h2>
            <div className="space-y-6">
              {knockoutStages.map(stage => {
                const stageMatches = knockoutMatches.filter(m => m.stage === stage)
                  .sort((a, b) => (a.match_position ?? 0) - (b.match_position ?? 0))
                return (
                  <div key={stage}>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">
                      {STAGE_LABELS[stage] ?? stage}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {stageMatches.map(m => (
                        <div key={m.id} className={`bg-white rounded-xl shadow p-3 border ${m.stage === 'final' ? 'border-yellow-300' : 'border-gray-100'}`}>
                          {m.stage === 'final' && <div className="text-xs font-bold text-yellow-600 mb-2 text-center">🏆 FINAL</div>}
                          <ScoreDisplay match={m} players={playersMap} />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {data.status === 'upcoming' && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">📅</div>
            <p>El torneo todavía no comenzó</p>
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 mt-4">
        ATP Castelar · Se actualiza cada 30 segundos
      </footer>
    </div>
  )
}
