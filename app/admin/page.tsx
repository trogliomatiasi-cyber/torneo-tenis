'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Tournament, Player } from '@/lib/supabase'
import { CATEGORY_BADGE, CATEGORY_COLORS } from '@/lib/ranking'

const ADMIN_PASSWORD = 'castelar2024'

const STATUS_LABEL: Record<string, string> = { upcoming: 'Próximamente', active: 'En curso', completed: 'Finalizado' }
const STATUS_COLOR: Record<string, string> = { upcoming: 'bg-gray-100 text-gray-600', active: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700' }

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('admin_auth') === 'true') {
      setAuth(true)
    }
  }, [])

  useEffect(() => {
    if (!auth) return
    async function load() {
      const [{ data: ts }, { data: ps }] = await Promise.all([
        supabase.from('tournaments').select('*').order('created_at', { ascending: false }),
        supabase.from('players').select('*').order('name'),
      ])
      setTournaments(ts ?? [])
      setPlayers(ps ?? [])
      setLoading(false)
    }
    load()
  }, [auth])

  function handleLogin() {
    if (pw === ADMIN_PASSWORD) {
      localStorage.setItem('admin_auth', 'true')
      setAuth(true)
    } else {
      setPwError(true)
    }
  }

  async function handleDeleteTournament(id: string, name: string) {
    if (!confirm(`¿Eliminar el torneo "${name}"? Esta acción no se puede deshacer.`)) return
    setDeleting(id)
    await fetch(`/api/tournaments/${id}`, { method: 'DELETE' })
    setTournaments(prev => prev.filter(t => t.id !== id))
    setDeleting(null)
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-[#F0F7F4] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔐</div>
            <h1 className="text-2xl font-bold text-[#1B4332]">Admin</h1>
            <p className="text-gray-400 text-sm">ATP Castelar</p>
          </div>
          <input
            type="password"
            placeholder="Contraseña"
            value={pw}
            onChange={e => { setPw(e.target.value); setPwError(false) }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className={`w-full border rounded-xl px-4 py-3 text-sm mb-3 outline-none focus:ring-2 focus:ring-emerald-400 ${pwError ? 'border-red-400' : 'border-gray-200'}`}
          />
          {pwError && <p className="text-red-500 text-xs mb-3">Contraseña incorrecta</p>}
          <button onClick={handleLogin} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition">
            Entrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      <header className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <Link href="/" className="text-emerald-300 text-sm hover:text-white transition mb-1 inline-block">← ATP Castelar</Link>
            <h1 className="text-2xl font-extrabold">Panel de Administración</h1>
          </div>
          <button
            onClick={() => { localStorage.removeItem('admin_auth'); setAuth(false) }}
            className="text-xs text-emerald-400 hover:text-white border border-emerald-700 px-3 py-1.5 rounded-lg transition"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/admin/torneo/nuevo" className="bg-emerald-600 text-white rounded-2xl p-5 hover:bg-emerald-700 transition shadow">
            <div className="text-3xl mb-2">➕</div>
            <div className="font-bold text-lg">Crear torneo</div>
            <div className="text-emerald-200 text-sm">Nuevo torneo del circuito</div>
          </Link>
          <Link href="/admin/jugadores" className="bg-white text-[#1B4332] rounded-2xl p-5 hover:shadow-md transition shadow border border-gray-100">
            <div className="text-3xl mb-2">👥</div>
            <div className="font-bold text-lg">Jugadores</div>
            <div className="text-gray-400 text-sm">{players.length} jugadores registrados</div>
          </Link>
        </div>

        <section>
          <h2 className="text-xl font-bold text-[#1B4332] mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-emerald-500 rounded-full inline-block" />
            Torneos
          </h2>
          {loading ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">Cargando...</div>
          ) : tournaments.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
              <div className="text-4xl mb-2">🎾</div>
              <p>Todavía no hay torneos. ¡Creá uno!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tournaments.map(t => (
                <div key={t.id} className="bg-white rounded-xl shadow p-4 border border-gray-100 flex items-center justify-between">
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
                    {t.start_date && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(t.start_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/torneo/${t.id}`} className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition">
                      Gestionar
                    </Link>
                    <button
                      onClick={() => handleDeleteTournament(t.id, t.name)}
                      disabled={deleting === t.id}
                      className="text-red-400 hover:text-red-600 text-xs px-2 py-1.5 rounded-lg border border-red-200 hover:border-red-400 transition"
                    >
                      {deleting === t.id ? '...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
