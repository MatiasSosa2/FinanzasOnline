'use client'

import { useState } from 'react'
import { createAreaNegocio, updateAreaNegocio, deleteAreaNegocio } from '@/app/actions'

export type AreaNegocio = { id: string; nombre: string; descripcion: string | null }

export default function AreaNegocioManager({ areas }: { areas: AreaNegocio[] }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  function abrirNuevo() {
    setEditandoId(null)
    setNombre('')
    setDescripcion('')
    setError(null)
    setMostrarForm(true)
  }

  function abrirEdicion(area: AreaNegocio) {
    setEditandoId(area.id)
    setNombre(area.nombre)
    setDescripcion(area.descripcion || '')
    setError(null)
    setMostrarForm(true)
  }

  function cancelar() {
    setMostrarForm(false)
    setEditandoId(null)
    setError(null)
  }

  async function handleGuardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    setError(null)

    const formData = new FormData()
    formData.set('nombre', nombre)
    formData.set('descripcion', descripcion)

    const resultado = editandoId
      ? await updateAreaNegocio(editandoId, formData)
      : await createAreaNegocio(formData)

    setEnviando(false)
    if (!resultado.success) {
      setError(resultado.error || 'Error desconocido')
      return
    }
    setMostrarForm(false)
    setEditandoId(null)
  }

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar esta área? Los movimientos vinculados quedarán sin área asignada.')) return
    setEliminandoId(id)
    await deleteAreaNegocio(id)
    setEliminandoId(null)
  }

  return (
    <div>
      {/* Lista de áreas */}
      {areas.length === 0 && !mostrarForm && (
        <div className="px-5 py-8 text-center text-gray-400 flex flex-col items-center gap-2">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-sm font-medium text-gray-400">Sin áreas registradas</p>
          <p className="text-sm text-gray-400">Crea áreas como: Administración, Ventas, Producción...</p>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {areas.map(area => (
          <div key={area.id} className="px-5 py-3.5 flex items-center gap-3 group hover:bg-gray-50 transition-colors">
            {/* Indicador de color */}
            <div className="w-1 h-8 bg-brand-military/40 shrink-0 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{area.nombre}</p>
              {area.descripcion && (
                <p className="text-xs text-gray-400 truncate mt-0.5">{area.descripcion}</p>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => abrirEdicion(area)}
                className="p-1.5 text-gray-400 hover:text-brand-military transition-colors"
                title="Editar"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleEliminar(area.id)}
                disabled={eliminandoId === area.id}
                className="p-1.5 text-gray-300 hover:text-red-600 transition-colors disabled:opacity-40"
                title="Eliminar"
              >
                {eliminandoId === area.id ? (
                  <span className="animate-spin h-3.5 w-3.5 block border-2 border-current border-t-transparent rounded-full"></span>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario de alta / edición */}
      {mostrarForm ? (
        <form onSubmit={handleGuardar} className="border-t border-gray-100 p-5 bg-gray-50/60 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm font-medium flex justify-between items-center rounded-xl">
              {error}
              <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-700 ml-2">&times;</button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">
              Nombre del área *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Administración, Ventas, Producción..."
              className="w-full text-sm font-medium text-gray-800 border border-black/[0.08] bg-white focus:border-brand-military outline-none px-3 py-2.5 rounded-xl transition-colors placeholder:text-gray-300"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Breve descripción del área..."
              className="w-full text-sm font-medium text-gray-700 border border-black/[0.08] bg-white focus:border-brand-military outline-none px-3 py-2.5 rounded-xl transition-colors placeholder:text-gray-300"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 py-2.5 text-sm font-medium bg-brand-military text-white hover:bg-brand-military-dark disabled:opacity-60 transition-colors rounded-xl"
            >
              {enviando ? 'Guardando...' : editandoId ? 'Actualizar área' : 'Crear área'}
            </button>
            <button
              type="button"
              onClick={cancelar}
              className="px-4 py-2.5 text-sm font-medium border border-black/[0.08] text-gray-500 hover:border-gray-300 transition-colors rounded-xl"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={abrirNuevo}
            className="w-full py-3 text-sm font-medium border border-dashed border-gray-200 text-gray-400 hover:border-brand-military hover:text-brand-military transition-colors rounded-xl flex items-center justify-center gap-2"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nueva área de negocio
          </button>
        </div>
      )}
    </div>
  )
}
