'use client'

import { useEffect, useState, useCallback } from 'react'
import { Player, Match, GroupStanding } from '@/lib/supabase'
import { calcularPosiciones } from '@/lib/tournament'

const GROUPS = ['A', 'B', 'C', 'D']

type TournamentData = { players: Player[]; matches: Match[] }

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth', { method: 'POST', body: JSON.stringify({ password: pw }), headers: { 'Content-Type': 'application/json' } })
    if (res.ok) {
      sessionStorage.setItem('admin', '1')
      onLogin()
    } else {
      setError('Clave incorrecta')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F0F7F4] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🎾</div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Panel Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Ingresá la clave del torneo</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Clave secreta"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1B4332] text-white rounded-xl py-3 font-semibold hover:bg-[#2D6A4F] transition disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

function SetupTab({ onDone }: { onDone: () => void }) {
  const [names, setNames] = useState<string[]>(Array(12).fill(''))
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleChange = (i: number, val: string) => {
    const updated = [...names]
    updated[i] = val
    setNames(updated)
  }

  const handleSubmit = async () => {
    const filled = names.map(n => n.trim()).filter(Boolean)
    if (filled.length < 12) { setMsg('Ingresá los 12 jugadores'); return }
    setLoading(true)
    setMsg('')
    const res = await fetch('/api/players', {
      method: 'POST',
      body: JSON.stringify({ names: filled }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      setMsg('✅ Sorteo realizado! Los grupos se generaron aleatoriamente.')
      onDone()
    } else {
      setMsg('Error al guardar')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Atención:</strong> Al hacer el sorteo se borra todo lo anterior y se generan grupos nuevos aleatoriamente.
        Los partidos se crean solos (todos contra todos en cada grupo).
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="font-bold text-lg text-gray-800 mb-4">Ingresá los 12 jugadores</h2>
        <div className="grid grid-cols-2 gap-3">
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-4 text-right">{i + 1}.</span>
              <input
                value={name}
                onChange={e => handleChange(i, e.target.value)}
                placeholder={`Jugador ${i + 1}`}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          ))}
        </div>

        {msg && (
          <p className={`mt-4 text-sm font-medium ${msg.startsWith('✅') ? 'text-emerald-600' : 'text-red-500'}`}>{msg}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full bg-[#1B4332] text-white rounded-xl py-3 font-bold hover:bg-[#2D6A4F] transition disabled:opacity-50 text-lg"
        >
          {loading ? 'Realizando sorteo...' : '🎲 Realizar Sorteo'}
        </button>
      </div>
    </div>
  )
}

function MatchResultForm({ match, players, onSaved, onCancel }: {
  match: Match
  players: Player[]
  onSaved: () => void
  onCancel: () => void
}) {
  const p1 = players.find(p => p.id === match.player1_id)
  const p2 = players.find(p => p.id === match.player2_id)
  const [s1p1, setS1p1] = useState(match.set1_p1?.toString() ?? '')
  const [s1p2, setS1p2] = useState(match.set1_p2?.toString() ?? '')
  const [s2p1, setS2p1] = useState(match.set2_p1?.toString() ?? '')
  const [s2p2, setS2p2] = useState(match.set2_p2?.toString() ?? '')
  const [tbp1, setTbp1] = useState(match.supertb_p1?.toString() ?? '')
  const [tbp2, setTbp2] = useState(match.supertb_p2?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const set1Winner = s1p1 !== '' && s1p2 !== '' ? (parseInt(s1p1) > parseInt(s1p2) ? 1 : parseInt(s1p2) > parseInt(s1p1) ? 2 : 0) : 0
  const set2Winner = s2p1 !== '' && s2p2 !== '' ? (parseInt(s2p1) > parseInt(s2p2) ? 1 : parseInt(s2p2) > parseInt(s2p1) ? 2 : 0) : 0
  const needsSuperTB = set1Winner !== 0 && set2Winner !== 0 && set1Winner !== set2Winner

  const handleSave = async () => {
    if (!s1p1 || !s1p2 || !s2p1 || !s2p2) { setErr('Completá los dos sets'); return }
    if (needsSuperTB && (!tbp1 || !tbp2)) { setErr('Completá el super tie-break'); return }
    setLoading(true)
    setErr('')
    const res = await fetch('/api/matches', {
      method: 'PATCH',
      body: JSON.stringify({
        id: match.id,
        set1_p1: parseInt(s1p1), set1_p2: parseInt(s1p2),
        set2_p1: parseInt(s2p1), set2_p2: parseInt(s2p2),
        supertb_p1: needsSuperTB ? parseInt(tbp1) : null,
        supertb_p2: needsSuperTB ? parseInt(tbp2) : null,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      if (match.stage === 'qf' || match.stage === 'sf') {
        await fetch('/api/setup', {
          method: 'POST',
          body: JSON.stringify({ action: 'advance_winner', match_id: match.id }),
          headers: { 'Content-Type': 'application/json' },
        })
      }
      onSaved()
    } else {
      setErr('Error al guardar')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('¿Borrar este resultado?')) return
    setLoading(true)
    await fetch('/api/matches', { method: 'DELETE', body: JSON.stringify({ id: match.id }), headers: { 'Content-Type': 'application/json' } })
    onSaved()
    setLoading(false)
  }

  const ScoreInput = ({ val, onChange, label }: { val: string; onChange: (v: string) => void; label: string }) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      <input
        type="number"
        min="0"
        max="99"
        value={val}
        onChange={e => onChange(e.target.value)}
        className="w-14 text-center border-2 border-gray-200 rounded-lg py-2 text-lg font-bold focus:outline-none focus:border-emerald-400"
      />
    </div>
  )

  return (
    <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-gray-800">{p1?.name} vs {p2?.name}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Set 1</p>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium w-24 truncate text-right">{p1?.name}</span>
            <ScoreInput val={s1p1} onChange={setS1p1} label="" />
            <span className="text-gray-300 font-bold">—</span>
            <ScoreInput val={s1p2} onChange={setS1p2} label="" />
            <span className="text-sm font-medium w-24 truncate">{p2?.name}</span>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Set 2</p>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium w-24 truncate text-right">{p1?.name}</span>
            <ScoreInput val={s2p1} onChange={setS2p1} label="" />
            <span className="text-gray-300 font-bold">—</span>
            <ScoreInput val={s2p2} onChange={setS2p2} label="" />
            <span className="text-sm font-medium w-24 truncate">{p2?.name}</span>
          </div>
        </div>

        {needsSuperTB && (
          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-600 mb-2 uppercase">Super Tie-Break (a 10)</p>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-24 truncate text-right">{p1?.name}</span>
              <ScoreInput val={tbp1} onChange={setTbp1} label="" />
              <span className="text-gray-300 font-bold">—</span>
              <ScoreInput val={tbp2} onChange={setTbp2} label="" />
              <span className="text-sm font-medium w-24 truncate">{p2?.name}</span>
            </div>
          </div>
        )}
      </div>

      {err && <p className="text-red-500 text-sm mt-3">{err}</p>}

      <div className="flex gap-3 mt-5">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 bg-[#1B4332] text-white rounded-xl py-2.5 font-bold hover:bg-[#2D6A4F] transition disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar resultado'}
        </button>
        {match.played && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition font-medium text-sm"
          >
            Borrar
          </button>
        )}
      </div>
    </div>
  )
}

function ResultsTab({ data, refresh }: { data: TournamentData; refresh: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [knockoutLoading, setKnockoutLoading] = useState(false)
  const [knockoutMsg, setKnockoutMsg] = useState('')
  const { players, matches } = data

  const groupMatches = matches.filter(m => m.stage === 'group')
  const allGroupsDone = groupMatches.length > 0 && groupMatches.every(m => m.played)
  const hasKnockouts = matches.some(m => m.stage === 'qf')

  const generateKnockouts = async () => {
    setKnockoutLoading(true)
    setKnockoutMsg('')
    const res = await fetch('/api/setup', {
      method: 'POST',
      body: JSON.stringify({ action: 'generate_knockouts' }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      setKnockoutMsg('✅ Cuartos generados correctamente')
      refresh()
    } else {
      setKnockoutMsg('Error al generar cuartos')
    }
    setKnockoutLoading(false)
  }

  const stages: { key: string; label: string }[] = [
    { key: 'group', label: 'Fase de Grupos' },
    { key: 'qf', label: 'Cuartos de Final' },
    { key: 'sf', label: 'Semifinales' },
    { key: 'final', label: 'Final' },
  ]

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {allGroupsDone && !hasKnockouts && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="font-semibold text-emerald-800 mb-2">
            ✅ Fase de grupos completada. ¿Generamos los cuartos?
          </p>
          {knockoutMsg && <p className="text-sm mb-3 text-emerald-700">{knockoutMsg}</p>}
          <button
            onClick={generateKnockouts}
            disabled={knockoutLoading}
            className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {knockoutLoading ? 'Generando...' : '🏆 Generar Cuartos de Final'}
          </button>
        </div>
      )}

      {stages.map(({ key, label }) => {
        const stageMatches = matches
          .filter(m => m.stage === key)
          .sort((a, b) => {
            if (a.group_name && b.group_name) return a.group_name.localeCompare(b.group_name)
            return (a.match_position ?? 0) - (b.match_position ?? 0)
          })

        if (stageMatches.length === 0) return null

        return (
          <div key={key}>
            <h3 className="text-lg font-bold text-[#1B4332] mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-emerald-500 rounded-full inline-block" />
              {label}
            </h3>
            <div className="space-y-3">
              {stageMatches.map(m => {
                const p1 = players.find(p => p.id === m.player1_id)
                const p2 = players.find(p => p.id === m.player2_id)

                if (editingId === m.id) {
                  return (
                    <MatchResultForm
                      key={m.id}
                      match={m}
                      players={players}
                      onSaved={() => { setEditingId(null); refresh() }}
                      onCancel={() => setEditingId(null)}
                    />
                  )
                }

                return (
                  <div
                    key={m.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        {m.group_name && (
                          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded">
                            Grupo {m.group_name}
                          </span>
                        )}
                        <span className={`font-semibold truncate ${m.winner_id === m.player1_id ? 'text-emerald-700' : 'text-gray-700'}`}>
                          {p1?.name ?? '–'}
                        </span>
                        <span className="text-gray-400">vs</span>
                        <span className={`font-semibold truncate ${m.winner_id === m.player2_id ? 'text-emerald-700' : 'text-gray-700'}`}>
                          {p2?.name ?? '–'}
                        </span>
                      </div>
                      {m.played && (
                        <p className="text-xs text-gray-500 mt-1 font-mono">
                          {m.set1_p1}-{m.set1_p2} · {m.set2_p1}-{m.set2_p2}
                          {m.supertb_p1 != null && ` · TB: ${m.supertb_p1}-${m.supertb_p2}`}
                          &nbsp;· Ganó: <strong className="text-emerald-700">
                            {players.find(p => p.id === m.winner_id)?.name}
                          </strong>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingId(m.id)}
                      disabled={!p1 || !p2}
                      className={`flex-shrink-0 text-sm px-4 py-2 rounded-lg font-medium transition
                        ${m.played
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-[#1B4332] text-white hover:bg-[#2D6A4F]'}
                        disabled:opacity-30`}
                    >
                      {m.played ? 'Editar' : 'Cargar resultado'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<'setup' | 'results'>('results')
  const [data, setData] = useState<TournamentData>({ players: [], matches: [] })

  useEffect(() => {
    if (sessionStorage.getItem('admin') === '1') setAuthed(true)
  }, [])

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/tournament?t=' + Date.now(), { cache: 'no-store' })
    setData(await res.json())
  }, [])

  useEffect(() => {
    if (authed) fetchData()
  }, [authed, fetchData])

  if (!authed) return <LoginScreen onLogin={() => { setAuthed(true) }} />

  const hasTournament = data.players.length > 0

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      <header className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">🎾 Panel Admin</h1>
            <p className="text-emerald-300 text-sm">Administrador del torneo</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs text-emerald-300 hover:text-white border border-emerald-600 px-3 py-1.5 rounded-lg transition">
              Ver página pública →
            </a>
            <button
              onClick={() => { sessionStorage.removeItem('admin'); setAuthed(false) }}
              className="text-xs text-emerald-400 hover:text-white transition"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 pb-0 flex gap-1">
          {(['results', 'setup'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition
                ${tab === t ? 'bg-[#F0F7F4] text-[#1B4332]' : 'text-emerald-300 hover:text-white'}`}
            >
              {t === 'results' ? '📋 Resultados' : '⚙️ Configurar Torneo'}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {tab === 'setup' && (
          <SetupTab onDone={() => { fetchData(); setTab('results') }} />
        )}
        {tab === 'results' && (
          hasTournament
            ? <ResultsTab data={data} refresh={fetchData} />
            : (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">⚙️</div>
                <h2 className="text-xl font-bold text-gray-700 mb-2">Todavía no hay torneo</h2>
                <p className="text-gray-500 mb-6">Primero tenés que configurar el torneo cargando los jugadores.</p>
                <button
                  onClick={() => setTab('setup')}
                  className="bg-[#1B4332] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2D6A4F] transition"
                >
                  Ir a Configurar Torneo →
                </button>
              </div>
            )
        )}
      </main>
    </div>
  )
}
