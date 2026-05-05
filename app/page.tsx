'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Tournament, Player, Match, RankingEntry } from '@/lib/supabase'
import { calcularRanking, CATEGORY_BADGE, CATEGORY_COLORS, ROUND_LABELS } from '@/lib/ranking'

type TournamentWithMatches = Tournament & { matches: Match[] }

const STATUS_LABEL: Record<string, string> = {
  upcoming: 'Próximamente',
  active: 'En curso',
  completed: 'Finalizado',
}
const STATUS_COLOR: Record<string, string> = {
  upcoming: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
}

export default function CircuitHome() {
  const [tournaments, setTournaments] = useState<TournamentWithMatches[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: ts }, { data: ps }, { data: ms }] = await Promise.all([
        supabase.from('tournaments').select('*').order('start_date', { ascending: false }),
        supabase.from('players').select('*').order('name'),
        supabase.from('matches').select('*'),
      ])
      const tList = ts ?? []
      const mList = ms ?? []
      const pList = ps ?? []
      const withMatches = tList.map((t: Tournament) => ({
        ...t,
        matches: mList.filter((m: Match) => m.tournament_id === t.id),
      }))
      setTournaments(withMatches)
      setPlayers(pList)
      setRanking(calcularRanking(withMatches, pList))
      setLoading(false)
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F7F4]">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const activeTournament = tournaments.find(t => t.status === 'active')

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      <header className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between">
          <div>
            <p className="text-emerald-300 text-sm font-semibold tracking-widest uppercase mb-1">Circuito Oficial</p>
            <h1 className="text-4xl font-extrabold tracking-tight">🎾 ATP Castelar</h1>
            <p className="text-emerald-300 text-sm mt-2">{tournaments.length} torneos · {players.length} jugadores</p>
          </div>
          <a href="/admin" className="text-xs text-emerald-400 hover:text-white border border-emerald-700 px-3 py-1.5 rounded-lg transition">
            Admin
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {activeTournament && (
          <section className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-1">🔴 En curso ahora</p>
            <h2 className="text-2xl font-extrabold mb-1">{activeTournament.name}</h2>
            <p className="text-emerald-200 text-sm mb-4">{CATEGORY_BADGE[activeTournament.category]}</p>
            <Link href={`/torneo/${activeTournament.id}`} className="bg-white text-emerald-700 px-5 py-2 rounded-xl font-bold text-sm hover:bg-emerald-50 transition">
              Ver torneo →
            </Link>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-[#1B4332] mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-emerald-500 rounded-full inline-block" />
              Ranking ATP Castelar
            </h2>
            {ranking.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400 text-sm">
                Aún no hay puntos registrados
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400 text-xs uppercase">
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Jugador</th>
                      <th className="px-4 py-2 text-center">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((r, i) => (
                      <tr key={r.player.id} className={`border-t ${i < 3 ? 'bg-emerald-50' : ''}`}>
                        <td className="px-4 py-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mx-auto
                            ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {r.player.name}
                          <span className="block text-xs text-gray-400">{ROUND_LABELS[r.bestResult] ?? ''}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-700">{r.totalPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-[#1B4332] mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-emerald-500 rounded-full inline-block" />
              Torneos
            </h2>
            {tournaments.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
                <div className="text-4xl mb-2">🎾</div>
                <p>Aún no hay torneos creados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tournaments.map(t => {
                  const finalMatch = t.matches.find(m => m.stage === 'final' && m.played && m.winner_id)
                  const champion = finalMatch?.winner as Player | undefined
                  return (
                    <Link key={t.id} href={`/torneo/${t.id}`} className="block bg-white rounded-xl shadow hover:shadow-md transition p-4 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[t.category]}`}>
                              {CATEGORY_BADGE[t.category]}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[t.status]}`}>
                              {STATUS_LABEL[t.status]}
                            </span>
                          </div>
                          <p className="font-bold text-gray-800">{t.name}</p>
                          {t.start_date && <p className="text-xs text-gray-400 mt-0.5">{new Date(t.start_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                          {champion && <p className="text-xs text-emerald-600 font-semibold mt-1">🏆 {champion.name}</p>}
                        </div>
                        <span className="text-gray-300 text-xl">→</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 mt-4">
        ATP Castelar · Se actualiza cada 30 segundos
      </footer>
    </div>
  )
}
