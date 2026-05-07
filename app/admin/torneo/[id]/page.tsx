'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, Tournament, Player, Match, TournamentPlayer } from '@/lib/supabase'
import { CATEGORY_BADGE, CATEGORY_COLORS, STAGE_LABELS } from '@/lib/ranking'

type TournamentData = Tournament & {
  tournament_players: (TournamentPlayer & { player: Player })[]
  matches: Match[]
}

function MatchResultForm({ match, players, onSaved, onCancel }: {
  match: Match
  players: Record<string, Player>
  onSaved: () => void
  onCancel: () => void
}) {
  const p1 = players[match.player1_id ?? '']
  const p2 = players[match.player2_id ?? '']
  const [s1p1, setS1p1] = useState(match.set1_p1?.toString() ?? '')
  const [s1p2, setS1p2] = useState(match.set1_p2?.toString() ?? '')
  const [s2p1, setS2p1] = useState(match.set2_p1?.toString() ?? '')
  const [s2p2, setS2p2] = useState(match.set2_p2?.toString() ?? '')
  const [tbp1, setTbp1] = useState(match.supertb_p1?.toString() ?? '')
  const [tbp2, setTbp2] = useState(match.supertb_p2?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const set1W = s1p1 !== '' && s1p2 !== '' ? (parseInt(s1p1) > parseInt(s1p2) ? 1 : parseInt(s1p2) > parseInt(s1p1) ? 2 : 0) : 0
  const set2W = s2p1 !== '' && s2p2 !== '' ? (parseInt(s2p1) > parseInt(s2p2) ? 1 : parseInt(s2p2) > parseInt(s2p1) ? 2 : 0) : 0
  const needsTB = set1W !== 0 && set2W !== 0 && set1W !== set2W

  async function handleSave() {
    if (!s1p1 || !s1p2 || !s2p1 || !s2p2) { setErr('Completá los dos sets'); return }
    if (needsTB && (!tbp1 || !tbp2)) { setErr('Completá el super tie-break'); return }
    setSaving(true)
    setErr('')
    const res = await fetch('/api/matches', {
      method: 'PATCH',
      body: JSON.stringify({
        id: match.id,
        set1_p1: parseInt(s1p1), set1_p2: parseInt(s1p2),
        set2_p1: parseInt(s2p1), set2_p2: parseInt(s2p2),
        supertb_p1: needsTB ? parseInt(tbp1) : null,
        supertb_p2: needsTB ? parseInt(tbp2) : null,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      onSaved()
    } else {
      setErr('Error al guardar')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('¿Borrar este resultado?')) return
    setSaving(true)
    await fetch('/api/matches', {
      method: 'DELETE',
      body: JSON.stringify({ id: match.id }),
      headers: { 'Content-Type': 'application/json' },
    })
    onSaved()
  }

  const ScoreInput = ({ val, onChange }: { val: string; onChange: (v: string) => void }) => (
    <input
      type="number" min="0" max="99"
      value={val}
      onChange={e => onChange(e.target.value)}
      className="w-14 text-center border-2 border-gray-200 rounded-lg py-2 text-lg font-bold focus:outline-none focus:border-emerald-400"
    />
  )

  return (
    <div className="bg-white border-2 border-emerald-300 rounded-2xl p-5 shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-gray-800">{p1?.name ?? 'TBD'} vs {p2?.name ?? 'TBD'}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
      </div>
      <div className="space-y-3">
        {[
          { label: 'Set 1', v1: s1p1, set1: setS1p1, v2: s1p2, set2: setS1p2 },
          { label: 'Set 2', v1: s2p1, set1: setS2p1, v2: s2p2, set2: setS2p2 },
        ].map(row => (
          <div key={row.label}>
            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase">{row.label}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium w-20 truncate text-right">{p1?.name ?? 'TBD'}</span>
              <ScoreInput val={row.v1} onChange={row.set1} />
              <span className="text-gray-300 font-bold">—</span>
              <ScoreInput val={row.v2} onChange={row.set2} />
              <span className="text-sm font-medium w-20 truncate">{p2?.name ?? 'TBD'}</span>
            </div>
          </div>
        ))}
        {needsTB && (
          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-600 mb-2 uppercase">Super Tie-Break</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium w-20 truncate text-right">{p1?.name ?? 'TBD'}</span>
              <ScoreInput val={tbp1} onChange={setTbp1} />
              <span className="text-gray-300 font-bold">—</span>
              <ScoreInput val={tbp2} onChange={setTbp2} />
              <span className="text-sm font-medium w-20 truncate">{p2?.name ?? 'TBD'}</span>
            </div>
          </div>
        )}
      </div>
      {err && <p className="text-red-500 text-sm mt-3">{err}</p>}
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 font-bold hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        {match.played && (
          <button
            onClick={handleDelete}
            disabled={saving}
            className="px-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition text-sm font-medium"
          >
            Borrar
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminTorneoPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<TournamentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [editingMatch, setEditingMatch] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState('')
  const [tab, setTab] = useState<'grupos' | 'knockout' | 'config'>('grupos')

  async function load() {
    const [{ data: t }, { data: tp }, { data: ms }, { data: ps }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('tournament_players').select('*, player:player_id(*)').eq('tournament_id', id),
      supabase.from('matches').select('*').eq('tournament_id', id),
      supabase.from('players').select('*').order('name'),
    ])
    if (t) {
      setData({ ...t, tournament_players: tp ?? [], matches: ms ?? [] })
      setSelectedPlayers((tp ?? []).map((x: TournamentPlayer) => x.player_id))
    }
    setAllPlayers(ps ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F7F4]">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!data) return <div className="min-h-screen flex items-center justify-center bg-[#F0F7F4]"><p>Torneo no encontrado</p></div>

  const playersMap: Record<string, Player> = {}
  data.tournament_players.forEach(tp => { if (tp.player) playersMap[tp.player.id] = tp.player })

  const groupMatches = data.matches.filter(m => m.stage === 'group')
  const knockoutMatches = data.matches.filter(m => m.stage !== 'group')
  const knockoutStages = Array.from(new Set(knockoutMatches.map(m => m.stage)))
  const stageOrder = ['r32', 'r16', 'qf', 'sf', 'final']
  knockoutStages.sort((a, b) => stageOrder.indexOf(a) - stageOrder.indexOf(b))

  const allGroupsDone = groupMatches.length > 0 && groupMatches.every(m => m.played)
  const hasKnockouts = knockoutMatches.length > 0
  const expectedPlayers = data.num_groups * data.players_per_group

  async function handleSorteo() {
    if (selectedPlayers.length !== expectedPlayers) {
      setActionMsg(`Seleccioná exactamente ${expectedPlayers} jugadores`)
      return
    }
    if (!confirm(`¿Realizar sorteo con ${selectedPlayers.length} jugadores? Se borrarán los datos actuales del torneo.`)) return
    setActionLoading(true)
    setActionMsg('')
    const res = await fetch(`/api/tournaments/${id}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'setup', player_ids: selectedPlayers }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      setActionMsg('✅ Sorteo realizado. Grupos generados.')
      await load()
      setTab('grupos')
    } else {
      const d = await res.json()
      setActionMsg(d.error ?? 'Error al realizar sorteo')
    }
    setActionLoading(false)
  }

  async function handleGenerateKnockouts() {
    if (!confirm('¿Generar fase eliminatoria con los clasificados de los grupos?')) return
    setActionLoading(true)
    setActionMsg('')
    const res = await fetch(`/api/tournaments/${id}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'generate_knockouts' }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      setActionMsg('✅ Fase eliminatoria generada.')
      await load()
      setTab('knockout')
    } else {
      const d = await res.json()
      setActionMsg(d.error ?? 'Error al generar eliminatoria')
    }
    setActionLoading(false)
  }

  function togglePlayer(pid: string) {
    setSelectedPlayers(prev =>
      prev.includes(pid) ? prev.filter(x => x !== pid) : [...prev, pid]
    )
  }

  const STATUS_LABEL: Record<string, string> = { upcoming: 'Próximamente', active: 'En curso', completed: 'Finalizado' }
  const STATUS_COLOR: Record<string, string> = { upcoming: 'bg-gray-100 text-gray-600', active: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700' }

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      <header className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <Link href="/admin" className="text-emerald-300 text-sm hover:text-white transition mb-2 inline-block">← Admin</Link>
          <div className="flex items-center gap-3 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[data.category]}`}>
              {CATEGORY_BADGE[data.category]}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[data.status]}`}>
              {STATUS_LABEL[data.status]}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold">{data.name}</h1>
          <div className="flex gap-1 mt-3">
            {(['grupos', 'knockout', 'config'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${tab === t ? 'bg-[#F0F7F4] text-[#1B4332]' : 'text-emerald-300 hover:text-white'}`}
              >
                {t === 'grupos' ? '📋 Grupos' : t === 'knockout' ? '🏆 Eliminatoria' : '⚙️ Configurar'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {actionMsg && (
          <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${actionMsg.startsWith('✅') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
            {actionMsg}
          </div>
        )}

        {tab === 'grupos' && (
          <div className="space-y-6">
            {groupMatches.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400">
                <div className="text-4xl mb-2">🎲</div>
                <p className="font-medium text-gray-600 mb-1">El sorteo no se ha realizado todavía</p>
                <p className="text-sm">Usá la pestaña <strong>Configurar</strong> para seleccionar jugadores y realizar el sorteo.</p>
                <button onClick={() => setTab('config')} className="mt-4 bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition">
                  Ir a Configurar →
                </button>
              </div>
            ) : (
              <>
                {allGroupsDone && !hasKnockouts && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                    <p className="font-semibold text-emerald-800">✅ Todos los partidos de grupos terminaron</p>
                    <button
                      onClick={handleGenerateKnockouts}
                      disabled={actionLoading}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {actionLoading ? '...' : 'Generar Eliminatoria →'}
                    </button>
                  </div>
                )}
                {Array.from(new Set(groupMatches.map(m => m.group_name))).sort().map(g => {
                  const gMatches = groupMatches.filter(m => m.group_name === g)
                  return (
                    <div key={g} className="bg-white rounded-2xl shadow overflow-hidden">
                      <div className="bg-emerald-700 text-white px-4 py-2 font-bold text-sm">Grupo {g}</div>
                      <div className="divide-y">
                        {gMatches.map(m => {
                          const p1 = playersMap[m.player1_id ?? '']
                          const p2 = playersMap[m.player2_id ?? '']
                          if (editingMatch === m.id) {
                            return <div key={m.id} className="p-4"><MatchResultForm match={m} players={playersMap} onSaved={() => { setEditingMatch(null); load() }} onCancel={() => setEditingMatch(null)} /></div>
                          }
                          return (
                            <div key={m.id} className="flex items-center justify-between px-4 py-3 gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className={`font-semibold truncate ${m.winner_id === m.player1_id ? 'text-emerald-700' : 'text-gray-700'}`}>{p1?.name ?? '?'}</span>
                                  <span className="text-gray-400 text-xs">vs</span>
                                  <span className={`font-semibold truncate ${m.winner_id === m.player2_id ? 'text-emerald-700' : 'text-gray-700'}`}>{p2?.name ?? '?'}</span>
                                </div>
                                {m.played && (
                                  <p className="text-xs text-gray-500 mt-0.5 font-mono">
                                    {m.set1_p1}-{m.set1_p2} · {m.set2_p1}-{m.set2_p2}
                                    {m.supertb_p1 != null && ` · [${m.supertb_p1}-${m.supertb_p2}]`}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => setEditingMatch(m.id)}
                                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-bold transition ${m.played ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                              >
                                {m.played ? 'Editar' : 'Cargar'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {tab === 'knockout' && (
          <div className="space-y-6">
            {!hasKnockouts ? (
              <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400">
                <div className="text-4xl mb-2">🏆</div>
                <p className="font-medium text-gray-600 mb-1">La fase eliminatoria no fue generada todavía</p>
                {allGroupsDone ? (
                  <button
                    onClick={handleGenerateKnockouts}
                    disabled={actionLoading}
                    className="mt-4 bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Generando...' : 'Generar Eliminatoria →'}
                  </button>
                ) : (
                  <p className="text-sm mt-2">Primero terminá todos los partidos de grupos.</p>
                )}
              </div>
            ) : (
              knockoutStages.map(stage => {
                const stageMatches = knockoutMatches.filter(m => m.stage === stage)
                  .sort((a, b) => (a.match_position ?? 0) - (b.match_position ?? 0))
                return (
                  <div key={stage}>
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-1 h-5 bg-emerald-500 rounded-full inline-block" />
                      {STAGE_LABELS[stage] ?? stage}
                    </h3>
                    <div className="space-y-2">
                      {stageMatches.map(m => {
                        const p1 = playersMap[m.player1_id ?? '']
                        const p2 = playersMap[m.player2_id ?? '']
                        if (editingMatch === m.id) {
                          return <div key={m.id}><MatchResultForm match={m} players={playersMap} onSaved={() => { setEditingMatch(null); load() }} onCancel={() => setEditingMatch(null)} /></div>
                        }
                        return (
                          <div key={m.id} className={`bg-white rounded-xl shadow p-4 flex items-center justify-between gap-4 border ${stage === 'final' ? 'border-yellow-300' : 'border-gray-100'}`}>
                            <div className="flex-1 min-w-0">
                              {stage === 'final' && <div className="text-xs font-bold text-yellow-600 mb-1">🏆 FINAL</div>}
                              <div className="flex items-center gap-2 text-sm">
                                <span className={`font-semibold truncate ${m.winner_id === m.player1_id ? 'text-emerald-700' : 'text-gray-700'}`}>{p1?.name ?? 'TBD'}</span>
                                <span className="text-gray-400 text-xs">vs</span>
                                <span className={`font-semibold truncate ${m.winner_id === m.player2_id ? 'text-emerald-700' : 'text-gray-700'}`}>{p2?.name ?? 'TBD'}</span>
                              </div>
                              {m.played && (
                                <p className="text-xs text-gray-500 mt-0.5 font-mono">
                                  {m.set1_p1}-{m.set1_p2} · {m.set2_p1}-{m.set2_p2}
                                  {m.supertb_p1 != null && ` · [${m.supertb_p1}-${m.supertb_p2}]`}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => setEditingMatch(m.id)}
                              disabled={!p1 || !p2}
                              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-bold transition disabled:opacity-30 ${m.played ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                            >
                              {m.played ? 'Editar' : 'Cargar'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {tab === 'config' && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-bold text-gray-700 mb-1">Seleccioná los jugadores</h2>
              <p className="text-sm text-gray-400 mb-4">
                Seleccioná exactamente <strong>{expectedPlayers}</strong> jugadores para este torneo ({data.num_groups} grupos de {data.players_per_group}).
                <span className={`ml-2 font-bold ${selectedPlayers.length === expectedPlayers ? 'text-emerald-600' : 'text-red-500'}`}>
                  {selectedPlayers.length}/{expectedPlayers} seleccionados
                </span>
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                {allPlayers.map(p => {
                  const selected = selectedPlayers.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlayer(p.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition text-left ${selected ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                    >
                      <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs ${selected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'}`}>
                        {selected ? '✓' : ''}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </button>
                  )
                })}
              </div>
              {allPlayers.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  No hay jugadores registrados.{' '}
                  <Link href="/admin/jugadores" className="text-emerald-600 underline">Agregá jugadores aquí</Link>
                </p>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <strong>Atención:</strong> Al realizar el sorteo se borra toda la data actual de este torneo y se genera un sorteo nuevo aleatorio.
            </div>

            <button
              onClick={handleSorteo}
              disabled={actionLoading || selectedPlayers.length !== expectedPlayers}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition disabled:opacity-50 shadow"
            >
              {actionLoading ? 'Realizando sorteo...' : '🎲 Realizar Sorteo'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
