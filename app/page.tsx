'use client'

import { useEffect, useState, useCallback } from 'react'
import { Player, Match, GroupStanding } from '@/lib/supabase'
import { calcularPosiciones } from '@/lib/tournament'

type TournamentData = {
  players: Player[]
  matches: Match[]
}

const GROUPS = ['A', 'B', 'C', 'D']
const GROUP_COLORS: Record<string, string> = {
  A: 'from-emerald-600 to-emerald-700',
  B: 'from-teal-600 to-teal-700',
  C: 'from-cyan-600 to-cyan-700',
  D: 'from-green-600 to-green-700',
}

function ScoreBadge({ m, pid }: { m: Match; pid: string | null }) {
  if (!m.played || !pid) return <span className="text-gray-400">–</span>

  const isP1 = pid === m.player1_id
  const s1 = isP1 ? m.set1_p1 : m.set1_p2
  const s2 = isP1 ? m.set2_p1 : m.set2_p2
  const tb = isP1 ? m.supertb_p1 : m.supertb_p2
  const won = m.winner_id === pid

  return (
    <span className={`text-sm font-mono font-bold ${won ? 'text-emerald-600' : 'text-red-400'}`}>
      {s1}-{isP1 ? m.set1_p2 : m.set1_p1}
      {s2 != null && <>, {s2}-{isP1 ? m.set2_p2 : m.set2_p1}</>}
      {tb != null && <> ({tb})</>}
    </span>
  )
}

function GroupTable({ group, standings, matches }: {
  group: string
  standings: GroupStanding[]
  matches: Match[]
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className={`bg-gradient-to-r ${GROUP_COLORS[group]} px-5 py-3 flex items-center gap-2`}>
        <span className="text-white font-bold text-xl">Grupo {group}</span>
      </div>

      {/* Tabla de posiciones */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Jugador</th>
              <th className="px-4 py-2 text-center">PJ</th>
              <th className="px-4 py-2 text-center">G</th>
              <th className="px-4 py-2 text-center">P</th>
              <th className="px-4 py-2 text-center">Sets</th>
              <th className="px-4 py-2 text-center">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => (
              <tr
                key={s.player.id}
                className={`border-t ${i < 2 ? 'bg-emerald-50' : ''}`}
              >
                <td className="px-4 py-3 text-center">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mx-auto
                    ${i < 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {i + 1}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">
                  {s.player.name}
                  {i < 2 && <span className="ml-2 text-xs text-emerald-600 font-normal">clasifica</span>}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">{s.played}</td>
                <td className="px-4 py-3 text-center font-semibold text-emerald-700">{s.wins}</td>
                <td className="px-4 py-3 text-center text-red-400">{s.losses}</td>
                <td className="px-4 py-3 text-center text-gray-600">{s.setsWon}/{s.setsLost}</td>
                <td className="px-4 py-3 text-center font-bold text-gray-800">{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Partidos del grupo */}
      <div className="border-t px-4 py-3 space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Partidos</p>
        {matches.map(m => (
          <div key={m.id} className="flex items-center justify-between text-sm gap-2 py-1">
            <span className={`font-medium flex-1 text-right truncate ${m.winner_id === m.player1_id ? 'text-emerald-700 font-bold' : 'text-gray-600'}`}>
              {(m.player1 as Player)?.name ?? '–'}
            </span>
            <div className="flex-shrink-0 text-center w-24">
              {m.played ? (
                <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                  {m.set1_p1}-{m.set1_p2} {m.set2_p1}-{m.set2_p2}
                  {m.supertb_p1 != null && ` (${m.supertb_p1}-${m.supertb_p2})`}
                </span>
              ) : (
                <span className="text-xs text-gray-400">pendiente</span>
              )}
            </div>
            <span className={`font-medium flex-1 truncate ${m.winner_id === m.player2_id ? 'text-emerald-700 font-bold' : 'text-gray-600'}`}>
              {(m.player2 as Player)?.name ?? '–'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BracketMatch({ label, match, roundLabel }: {
  label: string
  match: Match | null
  roundLabel?: string
}) {
  const p1 = match?.player1 as Player | undefined
  const p2 = match?.player2 as Player | undefined

  return (
    <div className="flex flex-col w-52">
      {roundLabel && (
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 text-center">{roundLabel}</p>
      )}
      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
        <div className={`flex items-center justify-between px-4 py-2.5 border-b
          ${match?.winner_id && match.winner_id === match.player1_id ? 'bg-emerald-50' : ''}`}>
          <span className={`font-medium text-sm truncate max-w-[110px] ${match?.winner_id === match?.player1_id ? 'text-emerald-700 font-bold' : 'text-gray-700'}`}>
            {p1?.name ?? <span className="text-gray-300 italic">Por definir</span>}
          </span>
          {match?.played && (
            <span className="text-xs font-mono text-gray-500 ml-1 flex-shrink-0">
              {match.set1_p1}-{match.set1_p2}{match.set2_p1 != null ? ` ${match.set2_p1}-${match.set2_p2}` : ''}
              {match.supertb_p1 != null ? ` (${match.supertb_p1})` : ''}
            </span>
          )}
        </div>
        <div className={`flex items-center justify-between px-4 py-2.5
          ${match?.winner_id && match.winner_id === match.player2_id ? 'bg-emerald-50' : ''}`}>
          <span className={`font-medium text-sm truncate max-w-[110px] ${match?.winner_id === match?.player2_id ? 'text-emerald-700 font-bold' : 'text-gray-700'}`}>
            {p2?.name ?? <span className="text-gray-300 italic">Por definir</span>}
          </span>
          {match?.played && (
            <span className="text-xs font-mono text-gray-500 ml-1 flex-shrink-0">
              {match.set1_p2}-{match.set1_p1}{match.set2_p2 != null ? ` ${match.set2_p2}-${match.set2_p1}` : ''}
              {match.supertb_p2 != null ? ` (${match.supertb_p2})` : ''}
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-center text-gray-400 mt-1">{label}</p>
    </div>
  )
}

export default function HomePage() {
  const [data, setData] = useState<TournamentData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/tournament')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // actualiza cada 30s
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Cargando torneo...</p>
      </div>
    </div>
  )

  const { players = [], matches = [] } = data ?? {}

  const groupStandings: Record<string, GroupStanding[]> = {}
  for (const g of GROUPS) {
    const gPlayers = players.filter(p => p.group_name === g)
    const gMatches = matches.filter(m => m.group_name === g && m.stage === 'group')
    groupStandings[g] = calcularPosiciones(gPlayers, gMatches)
  }

  const qfMatches = matches.filter(m => m.stage === 'qf').sort((a, b) => (a.match_position ?? 0) - (b.match_position ?? 0))
  const sfMatches = matches.filter(m => m.stage === 'sf').sort((a, b) => (a.match_position ?? 0) - (b.match_position ?? 0))
  const finalMatch = matches.find(m => m.stage === 'final')

  const hasKnockouts = qfMatches.length > 0
  const hasTournamentStarted = players.length > 0

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              🎾 Torneo de Tenis
            </h1>
            <p className="text-emerald-300 text-sm mt-1">12 jugadores · Grupos + Eliminación directa</p>
          </div>
          <a
            href="/admin"
            className="text-xs text-emerald-400 hover:text-emerald-200 transition-colors border border-emerald-700 px-3 py-1.5 rounded-lg"
          >
            Admin
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {!hasTournamentStarted ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎾</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Torneo aún no iniciado</h2>
            <p className="text-gray-500">El organizador aún no cargó los jugadores. Volvé más tarde.</p>
          </div>
        ) : (
          <>
            {/* Fase de grupos */}
            <section>
              <h2 className="text-2xl font-bold text-[#1B4332] mb-6 flex items-center gap-2">
                <span className="w-1 h-7 bg-emerald-500 rounded-full inline-block" />
                Fase de Grupos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {GROUPS.map(g => (
                  <GroupTable
                    key={g}
                    group={g}
                    standings={groupStandings[g] ?? []}
                    matches={matches.filter(m => m.group_name === g && m.stage === 'group')}
                  />
                ))}
              </div>
            </section>

            {/* Eliminación directa */}
            {hasKnockouts && (
              <section>
                <h2 className="text-2xl font-bold text-[#1B4332] mb-6 flex items-center gap-2">
                  <span className="w-1 h-7 bg-emerald-500 rounded-full inline-block" />
                  Eliminación Directa
                </h2>

                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-8 items-center min-w-max">
                    {/* Cuartos */}
                    <div className="flex flex-col gap-4">
                      {qfMatches.map((m, i) => (
                        <BracketMatch
                          key={m.id}
                          label={`QF${i + 1}`}
                          match={m}
                          roundLabel={i === 0 ? 'Cuartos de Final' : undefined}
                        />
                      ))}
                    </div>

                    <div className="flex flex-col gap-16 items-center">
                      <div className="text-2xl text-gray-300">→</div>
                      <div className="text-2xl text-gray-300">→</div>
                    </div>

                    {/* Semis */}
                    <div className="flex flex-col gap-20 justify-around h-full">
                      {sfMatches.map((m, i) => (
                        <BracketMatch
                          key={m.id}
                          label={`SF${i + 1}`}
                          match={m}
                          roundLabel={i === 0 ? 'Semifinales' : undefined}
                        />
                      ))}
                    </div>

                    <div className="flex flex-col items-center self-center">
                      <div className="text-2xl text-gray-300">→</div>
                    </div>

                    {/* Final */}
                    <div className="self-center">
                      <BracketMatch
                        label="FINAL"
                        match={finalMatch ?? null}
                        roundLabel="Final"
                      />

                      {finalMatch?.winner_id && (
                        <div className="mt-6 text-center">
                          <div className="text-3xl mb-1">🏆</div>
                          <p className="font-extrabold text-xl text-[#1B4332]">
                            {(finalMatch.winner as Player)?.name}
                          </p>
                          <p className="text-sm text-gray-500">Campeón del Torneo</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 mt-8">
        Se actualiza automáticamente cada 30 segundos
      </footer>
    </div>
  )
}
