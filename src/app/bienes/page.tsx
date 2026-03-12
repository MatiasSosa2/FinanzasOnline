'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  getBienesDeUso,
  createBienDeUso,
  updateBienDeUso,
  deleteBienDeUso,
  getAccounts,
} from '@/app/actions'

// ---- Tipos ----
type Account = { id: string; name: string; currentBalance: number; currency: string }

type BienDeUso = {
  id: string
  nombre: string
  descripcion: string | null
  categoria: string
  fechaCompra: Date | string
  valorCompra: number
  currency: string
  vidaUtilMeses: number
  valorResidual: number
  estado: string
  notas: string | null
  activo: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

// ---- Helpers ----
const CATEGORIAS: { value: string; label: string; icon: string }[] = [
  { value: 'TECNOLOGIA', label: 'Tecnología', icon: '💻' },
  { value: 'MOBILIARIO', label: 'Mobiliario', icon: '🪑' },
  { value: 'VEHICULO', label: 'Vehículo', icon: '🚗' },
  { value: 'HERRAMIENTA', label: 'Herramienta', icon: '🔧' },
  { value: 'INMUEBLE', label: 'Inmueble', icon: '🏢' },
  { value: 'OTRO', label: 'Otro', icon: '📦' },
]

const ESTADOS: { value: string; label: string; color: string }[] = [
  { value: 'EN_USO', label: 'En uso', color: '#2D6A4F' },
  { value: 'VENDIDO', label: 'Vendido', color: '#C5A065' },
  { value: 'DADO_DE_BAJA', label: 'Dado de baja', color: '#6b7280' },
]

function getCatInfo(val: string) {
  return CATEGORIAS.find(c => c.value === val) ?? { value: val, label: val, icon: '📦' }
}

function getEstadoInfo(val: string) {
  return ESTADOS.find(e => e.value === val) ?? { value: val, label: val, color: '#6b7280' }
}

function fmt(n: number, cur: string = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: cur === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function calcDepreciacion(bien: BienDeUso) {
  const hoy = new Date()
  const compra = new Date(bien.fechaCompra)
  const mesesTranscurridos =
    (hoy.getFullYear() - compra.getFullYear()) * 12 +
    (hoy.getMonth() - compra.getMonth())
  const base = bien.valorCompra - bien.valorResidual
  const depMensual = bien.vidaUtilMeses > 0 ? base / bien.vidaUtilMeses : 0
  const depAcumulada = Math.min(depMensual * Math.max(mesesTranscurridos, 0), base)
  const valorLibros = bien.valorCompra - depAcumulada
  const porcentaje = base > 0 ? (depAcumulada / base) * 100 : 0
  const mesesRestantes = Math.max(bien.vidaUtilMeses - mesesTranscurridos, 0)
  return { depMensual, depAcumulada, valorLibros, porcentaje, mesesRestantes, mesesTranscurridos }
}

function toInputDate(val: Date | string): string {
  const d = new Date(val)
  return d.toISOString().slice(0, 10)
}

// ---- Formulario ----
type FormProps = {
  editingBien: BienDeUso | null
  accounts: Account[]
  onCancel: () => void
  onSaved: () => void
}

function BienForm({ editingBien, accounts, onCancel, onSaved }: FormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [currency, setCurrency] = useState(editingBien?.currency ?? 'ARS')
  const [categoria, setCategoria] = useState(editingBien?.categoria ?? 'TECNOLOGIA')
  const [estado, setEstado] = useState(editingBien?.estado ?? 'EN_USO')
  const [accountId, setAccountId] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    fd.set('currency', currency)
    fd.set('categoria', categoria)
    fd.set('estado', estado)
    fd.set('accountId', accountId)
    startTransition(async () => {
      const result = editingBien
        ? await updateBienDeUso(editingBien.id, fd)
        : await createBienDeUso(fd)
      if (result.success) {
        onSaved()
      } else {
        setError(result.error ?? 'Error desconocido')
      }
    })
  }

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 rounded-t-xl flex justify-between items-center" style={{ background: '#1B4332' }}>
          <div>
            <h2 className="text-base font-semibold text-white">
              {editingBien ? 'Editar Bien de Uso' : 'Nuevo Bien de Uso'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(167,243,208,0.70)' }}>
              PC, muebles, vehículos, herramientas...
            </p>
          </div>
          <button onClick={onCancel} className="text-white/60 hover:text-white text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del bien *</label>
            <input
              name="nombre"
              defaultValue={editingBien?.nombre}
              placeholder="Ej: MacBook Pro M3, Silla ergonómica..."
              required
              className={inputClass}
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Categoría *</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIAS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategoria(c.value)}
                  className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs font-medium transition-all"
                  style={
                    categoria === c.value
                      ? { background: '#D8F3DC', borderColor: '#2D6A4F', color: '#1B4332' }
                      : { borderColor: '#e5e7eb', color: '#6b7280' }
                  }
                >
                  <span className="text-lg">{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha + Moneda */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de compra *</label>
              <input
                name="fechaCompra"
                type="date"
                defaultValue={editingBien ? toInputDate(editingBien.fechaCompra) : new Date().toISOString().slice(0, 10)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Moneda</label>
              <div className="flex gap-2">
                {(['ARS', 'USD'] as const).map(cur => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setCurrency(cur)}
                    className="flex-1 py-2 rounded-lg border text-sm font-semibold transition-all"
                    style={
                      currency === cur
                        ? { background: '#1B4332', color: 'white', borderColor: '#1B4332' }
                        : { borderColor: '#e5e7eb', color: '#6b7280' }
                    }
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Valor compra + Valor residual */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor de compra *</label>
              <input
                name="valorCompra"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={editingBien?.valorCompra}
                placeholder="0"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Valor residual
                <span className="text-gray-400 font-normal ml-1">(al final de vida útil)</span>
              </label>
              <input
                name="valorResidual"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editingBien?.valorResidual ?? 0}
                placeholder="0"
                className={inputClass}
              />
            </div>
          </div>

          {/* Vida útil */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Vida útil estimada (meses)
              <span className="text-gray-400 font-normal ml-1">— determina la depreciación mensual</span>
            </label>
            <div className="flex gap-2">
              {[24, 36, 60, 120].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={e => {
                    const input = (e.currentTarget.parentElement!.querySelector('input') as HTMLInputElement)
                    input.value = String(m)
                  }}
                  className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition-colors"
                >
                  {m === 24 ? '2 años' : m === 36 ? '3 años' : m === 60 ? '5 años' : '10 años'}
                </button>
              ))}
              <input
                name="vidaUtilMeses"
                type="number"
                min="1"
                max="600"
                defaultValue={editingBien?.vidaUtilMeses ?? 60}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
              />
            </div>
          </div>

          {/* Cuenta de egreso — solo en alta nueva */}
          {!editingBien && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">¿De qué cuenta sale el dinero?</label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className={inputClass}
              >
                <option value="">— No registrar movimiento de caja —</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency} {a.currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })})
                  </option>
                ))}
              </select>
              {accountId ? (
                <p className="text-[11px] mt-1.5 text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5">
                  ✓ Al guardar, se desconta el valor de compra de esta cuenta y queda registrado como gasto en &quot;Bienes de Uso&quot;
                </p>
              ) : (
                <p className="text-[11px] mt-1.5 text-gray-400">
                  Si no elegís cuenta, el bien queda registrado pero el saldo de caja no se modifica.
                </p>
              )}
            </div>
          )}

          {/* Estado */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
            <div className="flex gap-2">
              {ESTADOS.map(e => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => setEstado(e.value)}
                  className="flex-1 py-2 rounded-lg border text-xs font-medium transition-all"
                  style={
                    estado === e.value
                      ? { background: e.color, color: 'white', borderColor: e.color }
                      : { borderColor: '#e5e7eb', color: '#6b7280' }
                  }
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción / Notas</label>
            <textarea
              name="descripcion"
              defaultValue={editingBien?.descripcion ?? ''}
              placeholder="Modelo, número de serie, proveedor..."
              rows={2}
              className={inputClass + ' resize-none'}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
              style={{ background: '#1B4332' }}
            >
              {isPending ? 'Guardando...' : editingBien ? 'Actualizar' : 'Registrar Bien'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Tarjeta de Bien ----
function BienCard({ bien, onEdit, onDelete }: { bien: BienDeUso; onEdit: () => void; onDelete: () => void }) {
  const cat = getCatInfo(bien.categoria)
  const est = getEstadoInfo(bien.estado)
  const dep = calcDepreciacion(bien)
  const pct = Math.min(dep.porcentaje, 100)
  const isFullyDep = pct >= 100

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.06)' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ background: '#F0FDF4' }}>
            {cat.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight">{bien.nombre}</p>
            <p className="text-xs text-gray-400 mt-0.5">{cat.label}</p>
          </div>
        </div>
        <span
          className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: est.color + '18', color: est.color }}
        >
          {est.label}
        </span>
      </div>

      {/* Valores */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Valor compra</p>
          <p className="text-sm font-mono font-semibold text-gray-700">{fmt(bien.valorCompra, bien.currency)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Dep. acumulada</p>
          <p className="text-sm font-mono font-semibold text-red-500">-{fmt(dep.depAcumulada, bien.currency)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Valor libros</p>
          <p className="text-sm font-mono font-semibold" style={{ color: '#2D6A4F' }}>
            {fmt(dep.valorLibros, bien.currency)}
          </p>
        </div>
      </div>

      {/* Barra depreciación */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <p className="text-[10px] text-gray-400">
            Depreciado: <span className="font-semibold text-gray-600">{pct.toFixed(0)}%</span>
          </p>
          <p className="text-[10px] text-gray-400">
            {isFullyDep ? 'Totalmente depreciado' : `${dep.mesesRestantes} meses restantes`}
          </p>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#2D6A4F',
            }}
          />
        </div>
      </div>

      {/* Depreciación mensual */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-400">
          Dep. mensual: <span className="font-mono font-medium text-gray-600">{fmt(dep.depMensual, bien.currency)}</span>
          <span className="ml-1 text-gray-300">· Comprado {new Date(bien.fechaCompra).toLocaleDateString('es-AR', { year: 'numeric', month: 'short' })}</span>
        </p>
        <div className="flex gap-1.5">
          <button
            onClick={onEdit}
            className="text-[11px] px-2 py-1 rounded border border-gray-200 text-gray-500 hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition-colors"
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            className="text-[11px] px-2 py-1 rounded border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors"
          >
            Dar de baja
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Página principal ----
export default function BienesPage() {
  const [bienes, setBienes] = useState<BienDeUso[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBien, setEditingBien] = useState<BienDeUso | null>(null)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS')
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [, startTransition] = useTransition()

  async function load() {
    setLoading(true)
    const [data, accs] = await Promise.all([getBienesDeUso(), getAccounts()])
    setBienes(data as BienDeUso[])
    setAccounts(accs as Account[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleEdit(bien: BienDeUso) {
    setEditingBien(bien)
    setShowForm(true)
  }

  function handleDelete(id: string) {
    if (!confirm('¿Dar de baja este bien? Quedará desactivado del sistema.')) return
    startTransition(async () => {
      await deleteBienDeUso(id)
      await load()
    })
  }

  // ---- KPIs ----
  const bienesEnUso = bienes.filter(b => b.estado === 'EN_USO')
  const totalValorCompra = bienesEnUso.reduce((s, b) => s + b.valorCompra, 0)
  const totalDepAcumulada = bienesEnUso.reduce((s, b) => s + calcDepreciacion(b).depAcumulada, 0)
  const totalValorLibros = bienesEnUso.reduce((s, b) => s + calcDepreciacion(b).valorLibros, 0)
  const depMensualTotal = bienesEnUso.reduce((s, b) => s + calcDepreciacion(b).depMensual, 0)

  // ---- Filtros ----
  const filtrados = bienes.filter(b => {
    const pasaCat = filtroCategoria === 'TODOS' || b.categoria === filtroCategoria
    const pasaEst = filtroEstado === 'TODOS' || b.estado === filtroEstado
    return pasaCat && pasaEst
  })

  return (
    <div className="p-8 max-w-[1920px] mx-auto font-sans text-gray-800 min-h-screen">
      {/* HEADER */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-archivo)' }}>
            Bienes de Uso
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Seguimiento de activos fijos · Se registran al cargar un <strong>Gasto</strong> marcado como bien de uso
          </p>
        </div>
        <button
          onClick={() => { setEditingBien(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
          style={{ background: '#1B4332' }}
          title="Registrá bienes anteriores que no pasaron por el formulario de gastos"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Carga manual
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-gray-100" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.06)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Total invertido</p>
          <p className="text-2xl font-mono font-semibold text-gray-800 num-tabular">{fmt(totalValorCompra)}</p>
          <p className="text-[11px] text-gray-400 mt-1">{bienesEnUso.length} bien{bienesEnUso.length !== 1 ? 'es' : ''} en uso</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.06)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Dep. acumulada</p>
          <p className="text-2xl font-mono font-semibold text-red-500 num-tabular">-{fmt(totalDepAcumulada)}</p>
          <p className="text-[11px] text-gray-400 mt-1">Valor consumido</p>
        </div>
        <div className="rounded-xl p-5 border" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.06)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#2D6A4F' }}>Valor en libros</p>
          <p className="text-2xl font-mono font-semibold num-tabular" style={{ color: '#1B4332' }}>{fmt(totalValorLibros)}</p>
          <p className="text-[11px] mt-1" style={{ color: '#4ADE80' }}>Valor residual actual</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.06)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Dep. mensual</p>
          <p className="text-2xl font-mono font-semibold text-gray-800 num-tabular">{fmt(depMensualTotal)}</p>
          <p className="text-[11px] text-gray-400 mt-1">Gasto fijo por depreciación</p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setFiltroCategoria('TODOS')}
            className="px-3 py-1 rounded-md text-xs font-medium transition-all"
            style={filtroCategoria === 'TODOS' ? { background: '#1B4332', color: 'white' } : { color: '#6b7280' }}
          >
            Todas
          </button>
          {CATEGORIAS.map(c => (
            <button
              key={c.value}
              onClick={() => setFiltroCategoria(c.value)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1"
              style={filtroCategoria === c.value ? { background: '#1B4332', color: 'white' } : { color: '#6b7280' }}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[{ value: 'TODOS', label: 'Todos' }, ...ESTADOS].map(e => (
            <button
              key={e.value}
              onClick={() => setFiltroEstado(e.value)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all"
              style={filtroEstado === e.value ? { background: '#1B4332', color: 'white' } : { color: '#6b7280' }}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#2D6A4F] rounded-full animate-spin mb-3" />
          <p className="text-sm">Cargando bienes...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4" style={{ background: '#F0FDF4' }}>
            🏢
          </div>
          <p className="text-base font-medium text-gray-600 mb-1">
            {bienes.length === 0 ? 'Todavía no hay bienes registrados' : 'Sin resultados para este filtro'}
          </p>
          <p className="text-sm text-gray-400 mb-4 text-center max-w-xs">
            {bienes.length === 0
              ? 'Cuando registrás un gasto y marcás “Es un bien de uso” (PC, mueble, vehículo...), aparece acá automáticamente'
              : 'Probá cambiando los filtros de categoría o estado'}
          </p>
          {bienes.length === 0 && (
            <button
              onClick={() => { setEditingBien(null); setShowForm(true) }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#1B4332' }}
            >
              + Agregar primer bien
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map(b => (
            <BienCard
              key={b.id}
              bien={b}
              onEdit={() => handleEdit(b)}
              onDelete={() => handleDelete(b.id)}
            />
          ))}
        </div>
      )}

      {/* MODAL */}
      {showForm && (
        <BienForm
          editingBien={editingBien}
          accounts={accounts}
          onCancel={() => { setShowForm(false); setEditingBien(null) }}
          onSaved={async () => {
            setShowForm(false)
            setEditingBien(null)
            await load()
          }}
        />
      )}
    </div>
  )
}
