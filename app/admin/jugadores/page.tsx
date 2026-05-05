'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Player } from '@/lib/supabase'

export default function JugadoresPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function load() {
    const { data } = await supabase.from('players').select('*').order('name')
    setPlayers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    setError('')
    const res = await fetch('/api/players', {
      method: 'POST',
      body: JSON.stringify({ name }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      setNewName('')
      await load()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al agregar jugador')
    }
    setAdding(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar a "${name}"? Se quitará de todos los torneos donde participe.`)) return
    setDeleting(id)
    await fetch('/api/players', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
      headers: { 'Content-Type': 'application/json' },
    })
    setPlayers(prev => prev.filter(p => p.id !== id))
    setDeleting(null)
  }

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      <header className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/admin" className="text-emerald-300 text-sm hover:text-white transition mb-2 inline-block">← Admin</Link>
          <h1 className="text-2xl font-extrabold">Jugadores del Circuito</h1>
          <p className="text-emerald-300 text-sm mt-1">{players.length} jugadores registrados</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="font-bold text-gray-700 mb-3">Agregar jugador</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => { setNewName(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Nombre del jugador"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {adding ? '...' : 'Agregar'}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Cargando...</div>
          ) : players.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No hay jugadores todavía</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {players.map((p, i) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                    <span className="font-medium text-gray-800">{p.name}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    disabled={deleting === p.id}
                    className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded border border-transparent hover:border-red-200 transition"
                  >
                    {deleting === p.id ? '...' : 'Eliminar'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
