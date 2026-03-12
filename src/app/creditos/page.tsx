'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { getCreditosDeudas, marcarEstadoCredito } from '@/app/actions'

type CreditoTx = {
  id: string
  description: string
  amount: number
  currency: string
  type: string
  fecha?: string
  date: Date | string
  fechaVencimiento: Date | string | null
  estado: string
  contact: { id: string; name: string; type: string } | null
  category: { name: string } | null
}

const CURRENCY_SYMBOL: Record<string, string> = { ARS: '$', USD: 'US$' }
const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  VENCIDO: 'Vencido',
  COBRADO: 'Cobrado',
  PAGADO: 'Pagado',
}
const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-brand-gold-light text-brand-gold-dark border-brand-gold/30',
  VENCIDO: 'bg-red-50 text-red-700 border-red-200',
  COBRADO: 'bg-brand-military-light text-brand-military-dark border-brand-military/20',
  PAGADO: 'bg-gray-100 text-gray-500 border-gray-200',
}

function fmt(v: number, cur = 'ARS') {
  return `${CURRENCY_SYMBOL[cur] || '$'}${v.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
}
function fmtDate(d: Date | string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function isVencido(fechaVencimiento: Date | string | null, estado: string) {
  if (!fechaVencimiento || estado === 'COBRADO' || estado === 'PAGADO') return false
  return new Date(fechaVencimiento) < new Date()
}

export default function CreditosPage() {
  const [creditos, setCreditos] = useState<CreditoTx[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'TODOS' | 'PENDIENTE' | 'VENCIDO' | 'COBRADO' | 'PAGADO'>('PENDIENTE')
  const [, startTransition] = useTransition()

  async function load() {
    const data = await getCreditosDeudas()
    setCreditos(data as unknown as CreditoTx[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleMarcar(id: string, estado: string) {
    startTransition(async () => {
      await marcarEstadoCredito(id, estado)
      await load()
    })
  }

  const filtered = filtro === 'TODOS' ? creditos : creditos.filter(c => c.estado === filtro)
  const cxc = creditos.filter(c => c.type === 'INCOME')
  const cxp = creditos.filter(c => c.type === 'EXPENSE')
  const pendienteCxC = cxc.filter(c => c.estado === 'PENDIENTE' || c.estado === 'VENCIDO').reduce((a, t) => a + t.amount, 0)
  const pendienteCxP = cxp.filter(c => c.estado === 'PENDIENTE' || c.estado === 'VENCIDO').reduce((a, t) => a + t.amount, 0)
  const vencidos = creditos.filter(c => isVencido(c.fechaVencimiento, c.estado)).length

  return (
    <div className="p-8 max-w-[1920px] mx-auto font-sans text-gray-800 min-h-screen">

      {/* HEADER */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-300/60 pb-6">
        <div>
          <p className="text-[9px] font-medium text-brand-gold uppercase tracking-[0.25em] mb-1">Conta Go</p>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 uppercase">Créditos y Deudas</h1>
          <p className="text-xs text-gray-400 mt-1 font-medium tracking-widest uppercase">Cuentas por Cobrar y Cuentas por Pagar</p>
        </div>
        <Link href="/" className="flex items-center gap-2 text-[10px] font-medium text-gray-500 uppercase tracking-widest hover:text-brand-military transition-colors border border-gray-300/80 px-4 py-2 bg-white/80 hover:border-brand-military rounded-sm backdrop-blur-sm">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Panel Principal
        </Link>
      </header>

      {/* KPI TILES */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-brand-military-light border border-brand-military/20 rounded-sm p-5 flex flex-col gap-1">
          <p className="text-[9px] font-medium text-brand-military uppercase tracking-widest">CxC Pendiente</p>
          <p className="text-2xl font-black font-mono text-brand-military-dark tracking-tighter">{fmt(pendienteCxC)}</p>
          <p className="text-[9px] text-brand-military/70">{cxc.filter(c => c.estado === 'PENDIENTE' || c.estado === 'VENCIDO').length} facturas</p>
        </div>
        <div className="bg-brand-gold-light border border-brand-gold/30 rounded-sm p-5 flex flex-col gap-1">
          <p className="text-[9px] font-medium text-brand-gold-dark uppercase tracking-widest">CxP Pendiente</p>
          <p className="text-2xl font-black font-mono text-brand-gold-dark tracking-tighter">{fmt(pendienteCxP)}</p>
          <p className="text-[9px] text-brand-gold-dark/70">{cxp.filter(c => c.estado === 'PENDIENTE' || c.estado === 'VENCIDO').length} obligaciones</p>
        </div>
        <div className={`border rounded-sm p-5 flex flex-col gap-1 ${vencidos > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-[9px] font-medium uppercase tracking-widest ${vencidos > 0 ? 'text-red-600' : 'text-gray-400'}`}>Vencidos</p>
          <p className={`text-2xl font-black font-mono tracking-tighter ${vencidos > 0 ? 'text-red-700' : 'text-gray-400'}`}>{vencidos}</p>
          <p className={`text-[9px] ${vencidos > 0 ? 'text-red-500' : 'text-gray-400'}`}>{vencidos > 0 ? 'Requieren atención' : 'Sin atrasos'}</p>
        </div>
        <div className="bg-[#1A1A1A] border border-gray-700 rounded-sm p-5 flex flex-col gap-1">
          <p className="text-[9px] font-medium text-brand-gold uppercase tracking-widest">Posición Neta</p>
          <p className={`text-2xl font-black font-mono tracking-tighter ${pendienteCxC - pendienteCxP >= 0 ? 'text-brand-military-light' : 'text-red-400'}`}>
            {pendienteCxC - pendienteCxP >= 0 ? '+' : ''}{fmt(pendienteCxC - pendienteCxP)}
          </p>
          <p className="text-[9px] text-gray-500">CxC − CxP</p>
        </div>
      </section>

      {/* FILTRO */}
      <div className="flex gap-2 mb-4">
        {(['TODOS', 'PENDIENTE', 'VENCIDO', 'COBRADO', 'PAGADO'] as const).map(e => (
          <button
            key={e}
            onClick={() => setFiltro(e)}
            className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 border transition-all rounded-sm
              ${filtro === e
                ? 'bg-brand-military text-white border-brand-military'
                : 'bg-white text-gray-500 border-gray-200 hover:border-brand-military hover:text-brand-military'
              }`}
          >
            {e === 'TODOS' ? 'Todos' : ESTADO_LABELS[e]}
          </button>
        ))}
      </div>

      {/* TABLA */}
      <div className="bg-white/90 backdrop-blur-sm border border-gray-200/80 shadow-lg rounded-sm">
        <div className="bg-[#1A1A1A] px-5 py-4 rounded-t-sm flex justify-between items-center">
          <h2 className="text-[10px] font-semibold text-white uppercase tracking-widest">Listado de Créditos y Deudas</h2>
          <div className="w-1.5 h-1.5 bg-brand-gold/60 rounded-full" />
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 uppercase tracking-widest">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xs text-gray-300 font-black uppercase tracking-widest mb-2">Sin registros</p>
            <p className="text-[10px] text-gray-300">Registrá un movimiento como "crédito o deuda" desde el formulario del Panel Principal</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-y-2 border-gray-200 text-[9px] font-black uppercase tracking-widest text-gray-400">
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Descripción</th>
                  <th className="px-4 py-3 text-left">Contacto</th>
                  <th className="px-4 py-3 text-right">Importe</th>
                  <th className="px-4 py-3 text-center">Categoría</th>
                  <th className="px-4 py-3 text-center">Vencimiento</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => {
                  const venc = isVencido(tx.fechaVencimiento, tx.estado)
                  const realEstado = venc ? 'VENCIDO' : tx.estado
                  return (
                    <tr key={tx.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${venc ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border
                          ${tx.type === 'INCOME'
                            ? 'bg-brand-military-light text-brand-military-dark border-brand-military/20'
                            : 'bg-brand-gold-light text-brand-gold-dark border-brand-gold/30'
                          }`}>
                          {tx.type === 'INCOME' ? '↑ CxC' : '↓ CxP'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium max-w-[200px] truncate">{tx.description}</td>
                      <td className="px-4 py-3 text-gray-500">{tx.contact?.name || '—'}</td>
                      <td className="px-4 py-3 text-right font-black font-mono">
                        <span className={tx.type === 'INCOME' ? 'text-brand-military-dark' : 'text-brand-gold-dark'}>
                          {fmt(tx.amount, tx.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400">{tx.category?.name || '—'}</td>
                      <td className={`px-4 py-3 text-center font-mono ${venc ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                        {fmtDate(tx.fechaVencimiento)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm border ${ESTADO_COLORS[realEstado] || ''}`}>
                          {ESTADO_LABELS[realEstado] || realEstado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(tx.estado === 'PENDIENTE' || tx.estado === 'VENCIDO') && (
                          <button
                            onClick={() => handleMarcar(tx.id, tx.type === 'INCOME' ? 'COBRADO' : 'PAGADO')}
                            className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 bg-brand-military text-white border border-brand-military hover:bg-brand-military-dark transition rounded-sm"
                          >
                            {tx.type === 'INCOME' ? 'Cobrar' : 'Pagar'}
                          </button>
                        )}
                        {(tx.estado === 'COBRADO' || tx.estado === 'PAGADO') && (
                          <button
                            onClick={() => handleMarcar(tx.id, 'PENDIENTE')}
                            className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 bg-white text-gray-400 border border-gray-200 hover:border-brand-military hover:text-brand-military transition rounded-sm"
                          >
                            Reabrir
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
