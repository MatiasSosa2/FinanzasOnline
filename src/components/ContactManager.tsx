'use client'

import React from 'react'

export type Contact = { id: string, name: string, type?: string, phone?: string | null, email?: string | null }

const TIPO_LABEL: Record<string, string> = { CLIENT: 'Cliente', SUPPLIER: 'Proveedor' }
const TIPO_COLOR: Record<string, string> = {
  CLIENT: 'bg-brand-military-light text-brand-military-dark border-brand-military/20',
  SUPPLIER: 'bg-brand-gold-light text-brand-gold-dark border-brand-gold/30',
}

export default function ContactManager({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-400">Sin contactos registrados</p>
        <p className="text-sm text-gray-400">Agregá clientes o proveedores para vincularlos a tus movimientos</p>
      </div>
    )
  }

  return (
    <div>
      {/* Encabezado columnas */}
      <div className="px-5 py-2 border-b border-gray-100 bg-gray-50/80 flex items-center gap-3">
        <div className="w-8 shrink-0" />
        <p className="flex-1 text-xs font-medium text-gray-400">Nombre</p>
        <p className="text-xs font-medium text-gray-400 w-20 text-right">Tipo</p>
      </div>

      {/* Lista */}
      <div className="divide-y divide-gray-100">
        {contacts.map(c => {
          const initial = c.name.charAt(0).toUpperCase()
          const tipo = c.type || 'CLIENT'
          return (
            <div key={c.id} className="px-5 py-3.5 flex items-center gap-3 group hover:bg-gray-50/70 transition-colors">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-white">{initial}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                {(c.phone || c.email) && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {c.phone || c.email}
                  </p>
                )}
              </div>

              {/* Tipo */}
              <span className={`text-xs font-medium px-2.5 py-0.5 border rounded-full shrink-0 ${TIPO_COLOR[tipo] || TIPO_COLOR['CLIENT']}`}>
                {TIPO_LABEL[tipo] || tipo}
              </span>
            </div>
          )
        })}
      </div>

      {/* Pie con contador */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">
          {contacts.length} contacto{contacts.length !== 1 ? 's' : ''}
        </span>
        <span className="text-xs text-gray-400">Gestioná desde Directorio</span>
      </div>
    </div>
  )
}
