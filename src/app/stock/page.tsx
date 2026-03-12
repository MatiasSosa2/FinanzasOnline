'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  getProductos, createProducto, updateProducto, deleteProducto,
  addMovimientoStock, getMovimientosStock,
} from '@/app/actions'

type Movimiento = {
  id: string; tipo: string; cantidad: number; precio: number; motivo: string | null; fecha: Date | string
}
type Producto = {
  id: string; nombre: string; descripcion: string | null; categoria: string | null
  marca: string | null; unidad: string; metodoCosteo: string; enTransito: number
  precioVenta: number; precioCosto: number; stockActual: number
  movimientos: Movimiento[]
}

const TIPO_COLORS: Record<string, string> = {
  ENTRADA: 'bg-brand-military-light text-brand-military-dark border-brand-military/20',
  SALIDA:  'bg-brand-gold-light text-brand-gold-dark border-brand-gold/30',
  AJUSTE:  'bg-gray-100 text-gray-500 border-gray-200',
}

function fmt(v: number) { return v.toLocaleString('es-AR', { minimumFractionDigits: 2 }) }
function fmtDate(d: Date | string) { return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) }

function InputRow({ label, name, type = 'text', step, defaultValue, required }: {
  label: string; name: string; type?: string; step?: string; defaultValue?: string | number; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</label>
      <input
        name={name} type={type} step={step} defaultValue={defaultValue} required={required}
        className="border-2 border-gray-300 bg-gray-50 rounded-sm px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:border-brand-military focus:bg-white transition"
      />
    </div>
  )
}

export default function StockPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedProductoId, setSelectedProductoId] = useState<string | null>(null)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [showMovForm, setShowMovForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [, startTransition] = useTransition()
  const [formError, setFormError] = useState('')
  const [movError, setMovError] = useState('')

  async function load() {
    const data = await getProductos()
    setProductos(data as Producto[])
    setLoading(false)
  }

  async function loadMovimientos(id: string) {
    const data = await getMovimientosStock(id)
    setMovimientos(data as Movimiento[])
  }

  useEffect(() => { load() }, [])

  function handleSelectProducto(id: string) {
    if (selectedProductoId === id) { setSelectedProductoId(null); setMovimientos([]) }
    else { setSelectedProductoId(id); loadMovimientos(id) }
    setShowMovForm(false)
  }

  function handleAgregarMov(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('productoId', selectedProductoId!)
    startTransition(async () => {
      const res = await addMovimientoStock(fd)
      if (!res.success) { setMovError(res.error); return }
      setMovError(''); setShowMovForm(false)
      await load(); await loadMovimientos(selectedProductoId!)
    })
  }

  function handleCreateOrUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = editingId ? await updateProducto(editingId, fd) : await createProducto(fd)
      if (!res.success) { setFormError(res.error); return }
      setFormError(''); setShowForm(false); setEditingId(null); await load()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('¿Desactivar este producto?')) return
    startTransition(async () => { await deleteProducto(id); await load() })
  }

  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.categoria || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const selectedProd = productos.find(p => p.id === selectedProductoId)

  const totalStockValue = productos.reduce((sum, p) => sum + p.stockActual * p.precioCosto, 0)
  const sinStock = productos.filter(p => p.stockActual <= 0).length
  const bajoStock = productos.filter(p => p.stockActual > 0 && p.stockActual < 5).length

  const editingProd = editingId ? productos.find(p => p.id === editingId) : null

  return (
    <div className="p-8 max-w-[1920px] mx-auto font-sans text-gray-800 min-h-screen">

      {/* HEADER */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-300/60 pb-6">
        <div>
          <p className="text-[9px] font-medium text-brand-gold uppercase tracking-[0.25em] mb-1">Conta Go</p>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 uppercase">Gestión de Stock</h1>
          <p className="text-xs text-gray-400 mt-1 font-medium tracking-widest uppercase">Inventario · Productos · Movimientos</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-[10px] font-medium text-gray-500 uppercase tracking-widest hover:text-brand-military transition-colors border border-gray-300/80 px-4 py-2 bg-white/80 hover:border-brand-military rounded-sm backdrop-blur-sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Panel
          </Link>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setFormError('') }}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-brand-military text-white border border-brand-military hover:bg-brand-military-dark rounded-sm transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto
          </button>
        </div>
      </header>

      {/* KPI TILES */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-brand-military-light border border-brand-military/20 rounded-sm p-5 flex flex-col gap-1">
          <p className="text-[9px] font-medium text-brand-military uppercase tracking-widest">Productos Activos</p>
          <p className="text-2xl font-black font-mono text-brand-military-dark tracking-tighter">{productos.length}</p>
        </div>
        <div className="bg-brand-gold-light border border-brand-gold/30 rounded-sm p-5 flex flex-col gap-1">
          <p className="text-[9px] font-medium text-brand-gold-dark uppercase tracking-widest">Valor en Stock</p>
          <p className="text-2xl font-black font-mono text-brand-gold-dark tracking-tighter">${fmt(totalStockValue)}</p>
          <p className="text-[9px] text-brand-gold-dark/70">A precio de costo</p>
        </div>
        <div className={`border rounded-sm p-5 flex flex-col gap-1 ${bajoStock > 0 ? 'bg-brand-gold-light border-brand-gold/30' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-[9px] font-medium uppercase tracking-widest ${bajoStock > 0 ? 'text-brand-gold-dark' : 'text-gray-400'}`}>Stock Bajo</p>
          <p className={`text-2xl font-black font-mono tracking-tighter ${bajoStock > 0 ? 'text-brand-gold-dark' : 'text-gray-400'}`}>{bajoStock}</p>
          <p className={`text-[9px] ${bajoStock > 0 ? 'text-brand-gold-dark/70' : 'text-gray-400'}`}>Menos de 5 unidades</p>
        </div>
        <div className={`border rounded-sm p-5 flex flex-col gap-1 ${sinStock > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-[9px] font-medium uppercase tracking-widest ${sinStock > 0 ? 'text-red-600' : 'text-gray-400'}`}>Sin Stock</p>
          <p className={`text-2xl font-black font-mono tracking-tighter ${sinStock > 0 ? 'text-red-700' : 'text-gray-400'}`}>{sinStock}</p>
          <p className={`text-[9px] ${sinStock > 0 ? 'text-red-500' : 'text-gray-400'}`}>{sinStock > 0 ? 'Requieren reposición' : 'Todo abastecido'}</p>
        </div>
      </section>

      {/* FORMULARIO NUEVO/EDITAR PRODUCTO */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg">
            <div className="bg-brand-military px-5 py-4 rounded-t-sm flex justify-between items-center">
              <h3 className="text-[10px] font-semibold text-white uppercase tracking-widest">
                {editingId ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-white/60 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateOrUpdate} className="p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputRow label="Nombre del Producto *" name="nombre" required defaultValue={editingProd?.nombre} />
              </div>
              <InputRow label="Marca" name="marca" defaultValue={editingProd?.marca || ''} />
              <InputRow label="Categoría" name="categoria" defaultValue={editingProd?.categoria || ''} />
              <InputRow label="Unidad de Medida" name="unidad" defaultValue={editingProd?.unidad || 'unidad'} />
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Método de Costeo</label>
                <select
                  name="metodoCosteo"
                  defaultValue={editingProd?.metodoCosteo || 'PROMEDIO'}
                  className="border-2 border-gray-300 bg-gray-50 rounded-sm px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:border-brand-military focus:bg-white transition"
                >
                  <option value="PROMEDIO">Promedio Ponderado</option>
                  <option value="FIFO">FIFO (Primero en entrar)</option>
                  <option value="LIFO">LIFO (Último en entrar)</option>
                </select>
              </div>
              <InputRow label="Precio de Costo" name="precioCosto" type="number" step="0.01" defaultValue={editingProd?.precioCosto || 0} />
              <InputRow label="Precio de Venta" name="precioVenta" type="number" step="0.01" defaultValue={editingProd?.precioVenta || 0} />
              <InputRow label="Stock Inicial" name="stockActual" type="number" step="0.01" defaultValue={editingProd?.stockActual || 0} />
              <InputRow label="En Tránsito" name="enTransito" type="number" step="0.01" defaultValue={editingProd?.enTransito || 0} />
              <div className="col-span-2">
                <InputRow label="Descripción" name="descripcion" defaultValue={editingProd?.descripcion || ''} />
              </div>
              {formError && <div className="col-span-2 text-[10px] text-red-600 font-bold uppercase bg-red-50 px-3 py-2 border border-red-200 rounded-sm">{formError}</div>}
              <div className="col-span-2 flex gap-3 justify-end pt-2 border-t border-gray-100">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 border border-gray-200 text-gray-500 hover:border-gray-400 rounded-sm">Cancelar</button>
                <button type="submit" className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-brand-military text-white border border-brand-military hover:bg-brand-military-dark rounded-sm transition">
                  {editingId ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LAYOUT: TABLA + PANEL LATERAL */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* TABLA PRODUCTOS */}
        <div className="xl:col-span-2 bg-white/90 backdrop-blur-sm border border-gray-200/80 shadow-lg rounded-sm flex flex-col">
          <div className="bg-[#1A1A1A] px-5 py-4 rounded-t-sm flex justify-between items-center shrink-0">
            <h2 className="text-[10px] font-semibold text-white uppercase tracking-widest">Inventario</h2>
            <div className="w-1.5 h-1.5 bg-brand-gold/60 rounded-full" />
          </div>

          {/* Búsqueda */}
          <div className="px-5 py-3 border-b border-gray-100">
            <input
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar producto o categoría…"
              className="w-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 rounded-sm focus:outline-none focus:border-brand-military"
            />
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-gray-400 uppercase tracking-widest">Cargando…</div>
          ) : filtrados.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-xs text-gray-300 font-black uppercase tracking-widest mb-2">Sin productos</p>
              <p className="text-[10px] text-gray-300">Usá el botón "Nuevo Producto" para agregar tu inventario</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-y-2 border-gray-200 text-[9px] font-black uppercase tracking-widest text-gray-400">
                    <th className="px-4 py-3 text-left">Producto</th>
                    <th className="px-4 py-3 text-center">Stock</th>
                    <th className="px-4 py-3 text-right">P. Costo</th>
                    <th className="px-4 py-3 text-right">P. Venta</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(prod => {
                    const isSelected = selectedProductoId === prod.id
                    const isLow = prod.stockActual > 0 && prod.stockActual < 5
                    const isOut = prod.stockActual <= 0
                    return (
                      <tr
                        key={prod.id}
                        className={`border-b border-gray-100 transition-colors cursor-pointer
                          ${isSelected ? 'bg-brand-military-light' : 'hover:bg-gray-50'}
                          ${isOut ? 'opacity-60' : ''}`}
                        onClick={() => handleSelectProducto(prod.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800">{prod.nombre}</div>
                          {prod.marca && <div className="text-[9px] text-brand-gold-dark font-black uppercase tracking-widest mt-0.5">{prod.marca}</div>}
                          {prod.categoria && <div className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">{prod.categoria}</div>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-black font-mono ${isOut ? 'text-red-600' : isLow ? 'text-brand-gold-dark' : 'text-gray-700'}`}>
                            {fmt(prod.stockActual)}
                          </span>
                          <span className="text-[9px] text-gray-400 ml-1">{prod.unidad}</span>
                          {isOut && <div className="text-[8px] text-red-500 font-bold uppercase">Sin stock</div>}
                          {isLow && <div className="text-[8px] text-brand-gold-dark font-bold uppercase">Stock bajo</div>}
                          {prod.enTransito > 0 && <div className="text-[8px] text-blue-500 font-bold uppercase">+{fmt(prod.enTransito)} en tránsito</div>}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-500">${fmt(prod.precioCosto)}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-gray-800">${fmt(prod.precioVenta)}</td>
                        <td className="px-4 py-3 text-right font-mono font-black text-brand-military-dark">${fmt(prod.stockActual * prod.precioCosto)}</td>
                        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => { setEditingId(prod.id); setShowForm(true); setFormError('') }}
                              className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 border border-gray-200 text-gray-500 hover:border-brand-military hover:text-brand-military transition rounded-sm"
                            >Editar</button>
                            <button
                              onClick={() => handleDelete(prod.id)}
                              className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition rounded-sm"
                            >✕</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PANEL LATERAL: MOVIMIENTOS */}
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/80 shadow-lg rounded-sm flex flex-col">
          <div className="bg-brand-military px-5 py-4 rounded-t-sm flex justify-between items-center shrink-0">
            <h2 className="text-[10px] font-semibold text-white uppercase tracking-widest">
              {selectedProd ? selectedProd.nombre : 'Movimientos'}
            </h2>
            <div className="w-1.5 h-1.5 bg-brand-military-light/60 rounded-full" />
          </div>

          {!selectedProd ? (
            <div className="p-8 text-center flex-1 flex flex-col items-center justify-center gap-2">
              <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Seleccioná un producto</p>
              <p className="text-[9px] text-gray-300">para ver sus movimientos</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Info del producto */}
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Stock</p>
                  <p className={`text-lg font-black font-mono ${selectedProd.stockActual <= 0 ? 'text-red-600' : selectedProd.stockActual < 5 ? 'text-brand-gold-dark' : 'text-brand-military-dark'}`}>
                    {fmt(selectedProd.stockActual)}
                  </p>
                </div>
                <div className="text-center border-x border-gray-200">
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Costo</p>
                  <p className="text-lg font-black font-mono text-gray-600">${fmt(selectedProd.precioCosto)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Venta</p>
                  <p className="text-lg font-black font-mono text-gray-800">${fmt(selectedProd.precioVenta)}</p>
                </div>
              </div>

              {/* Botón agregar movimiento */}
              <div className="px-5 py-3 border-b border-gray-100">
                <button
                  onClick={() => setShowMovForm(!showMovForm)}
                  className="w-full text-[10px] font-bold uppercase tracking-widest py-2 border-2 border-dashed border-brand-military text-brand-military hover:bg-brand-military-light transition rounded-sm"
                >
                  {showMovForm ? 'Cancelar' : '+ Registrar Movimiento'}
                </button>
              </div>

              {/* Formulario de movimiento */}
              {showMovForm && (
                <form onSubmit={handleAgregarMov} className="px-5 py-4 border-b border-gray-100 bg-brand-military-light/40 flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Tipo</label>
                    <select name="tipo" className="border-2 border-gray-300 bg-gray-50 rounded-sm px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-brand-military">
                      <option value="ENTRADA">Entrada</option>
                      <option value="SALIDA">Salida</option>
                      <option value="AJUSTE">Ajuste de inventario</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Cantidad</label>
                      <input name="cantidad" type="number" step="0.01" min="0.01" required
                        className="border-2 border-gray-300 bg-gray-50 rounded-sm px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:border-brand-military" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Precio Unit.</label>
                      <input name="precio" type="number" step="0.01" min="0" defaultValue="0"
                        className="border-2 border-gray-300 bg-gray-50 rounded-sm px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:border-brand-military" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Motivo</label>
                    <input name="motivo" type="text" placeholder="Compra proveedor / Venta / etc"
                      className="border-2 border-gray-300 bg-gray-50 rounded-sm px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-brand-military" />
                  </div>
                  {movError && <div className="text-[10px] text-red-600 font-bold uppercase bg-red-50 px-3 py-2 border border-red-200 rounded-sm">{movError}</div>}
                  <button type="submit" className="text-[10px] font-bold uppercase tracking-widest py-2 bg-brand-military text-white border border-brand-military hover:bg-brand-military-dark rounded-sm transition">
                    Registrar
                  </button>
                </form>
              )}

              {/* Lista de movimientos */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {movimientos.length === 0 ? (
                  <div className="p-6 text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest">Sin movimientos</div>
                ) : movimientos.map(m => (
                  <div key={m.id} className="px-5 py-3 flex justify-between items-center">
                    <div>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border ${TIPO_COLORS[m.tipo] || ''}`}>
                        {m.tipo}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">{m.motivo || '—'}</p>
                      <p className="text-[9px] text-gray-300 mt-0.5">{fmtDate(m.fecha)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-black font-mono text-sm ${m.tipo === 'ENTRADA' ? 'text-brand-military-dark' : m.tipo === 'SALIDA' ? 'text-brand-gold-dark' : 'text-gray-500'}`}>
                        {m.tipo === 'SALIDA' ? '-' : m.tipo === 'AJUSTE' ? '=' : '+'}{fmt(m.cantidad)}
                      </p>
                      {m.precio > 0 && <p className="text-[9px] text-gray-400 font-mono">${fmt(m.precio)}/u</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
