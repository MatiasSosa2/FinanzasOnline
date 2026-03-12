'use client'

import React from 'react'

export type Category = { id: string, name: string }

export default function CategoryManager({ categories }: { categories: Category[] }) {
  // Diseño limpio - Sin colores de identidad fuertes
  return (
    <div className="p-6">
        <div className="space-y-4">
            {categories.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-4">Sin registros</p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <span key={cat.id} className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200 shadow-sm">
                            {cat.name}
                        </span>
                    ))}
                </div>
            )}
            
            <div className="mt-6">
                <button disabled className="w-full py-3 border border-dashed border-slate-200 text-slate-400 text-sm font-medium rounded-xl hover:bg-slate-50 transition-all">
                    + Nueva Categoría
                </button>
            </div>
        </div>
    </div>
  )
}
