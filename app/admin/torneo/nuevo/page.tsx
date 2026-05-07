'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NuevoTorneoPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    category: '250',
    start_date: '',
    num_groups: 4,
    players_per_group: 3,
    players_advancing: 2,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalPlayers = form.num_groups * form.players_per_group
  const totalAdvancing = form.num_groups * form.players_advancing

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleCreate() {
    if (!form.name.trim()) { setError('Ingresá un nombre para el torneo'); return }
    if (form.players_advancing >= form.players_per_group) { setError('Los jugadores que avanzan deben ser menos que los del grupo'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/tournaments', {
      method: 'POST',
      body: JSON.stringify(form),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      const data = await res.json()
      router.push(`/admin/torneo/${data.id}`)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al crear torneo')
      setLoading(false)
    }
  }

  const categoryInfo: Record<string, { label: string; color: string; desc: string }> = {
    '250': { label: 'ATP 250', color: 'border-slate-400 bg-slate-50', desc: 'Campeón: 250 pts' },
    '500': { label: 'ATP 500', color: 'border-blue-400 bg-blue-50', desc: 'Campeón: 500 pts' },
    '1000': { label: 'ATP 1000', color: 'border-yellow-400 bg-yellow-50', desc: 'Campeón: 1000 pts' },
    '2000': { label: 'ATP 2000', color: 'border-purple-400 bg-purple-50', desc: 'Campeón: 2000 pts' },
  }

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      <header className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Link href="/admin" className="text-emerald-300 text-sm hover:text-white transition mb-2 inline-block">← Admin</Link>
          <h1 className="text-2xl font-extrabold">Crear nuevo torneo</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="font-bold text-gray-700">Información básica</h2>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Nombre del torneo</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ej: Copa Verano 2025"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Fecha de inicio (opcional)</label>
            <input
              type="date"
              value={form.start_date}
              onChange={e => set('start_date', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-bold text-gray-700 mb-3">Categoría</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['250', '500', '1000', '2000'] as const).map(cat => {
              const info = categoryInfo[cat]
              return (
                <button
                  key={cat}
                  onClick={() => set('category', cat)}
                  className={`border-2 rounded-xl p-3 text-center transition ${form.category === cat ? info.color + ' border-opacity-100' : 'border-gray-200 bg-white'}`}
                >
                  <div className="font-bold text-sm">{info.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{info.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="font-bold text-gray-700">Estructura del torneo</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">N° de grupos</label>
              <select
                value={form.num_groups}
                onChange={e => set('num_groups', parseInt(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {[2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Jugadores/grupo</label>
              <select
                value={form.players_per_group}
                onChange={e => set('players_per_group', parseInt(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Avanzan por grupo</label>
              <select
                value={form.players_advancing}
                onChange={e => set('players_advancing', parseInt(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {[1, 2, 3, 4].filter(n => n < form.players_per_group).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-sm text-emerald-800">
            <strong>{totalPlayers} jugadores</strong> en {form.num_groups} grupos de {form.players_per_group}.
            Avanzan {totalAdvancing} al cuadro eliminatorio.
          </div>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition disabled:opacity-50 shadow"
        >
          {loading ? 'Creando...' : 'Crear torneo →'}
        </button>
      </main>
    </div>
  )
}
