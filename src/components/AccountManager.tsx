'use client'

import { useState } from 'react'
import { createAccount, updateAccount, deleteAccount } from '@/app/actions'

type Account = { id: string, name: string, currentBalance: number, currency: string }

const CURRENCY_SYMBOL: Record<string, string> = { ARS: '$', USD: 'US$' }

export default function AccountManager({ accounts }: { accounts: Account[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    const name = formData.get('name')
    if (!name) return
    
    if (editing) {
      await updateAccount(editing.id, formData)
      setEditing(null)
    } else {
      await createAccount(formData)
    }
    setIsOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta cuenta? Solo se puede si no tiene transacciones.')) return
    setDeletingId(id)
    setError(null)
    const result = await deleteAccount(id)
    if (!result.success) {
      setError(result.error)
    }
    setDeletingId(null)
  }

  function openEdit(account: Account) {
    setEditing(account)
    setIsOpen(true)
    setError(null)
  }

  function openNew() {
    setEditing(null)
    setIsOpen(true)
    setError(null)
  }

  return (
    <div className="flex flex-col gap-4 w-full">
       {error && (
         <div className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-sm">
           Error: {error}
         </div>
       )}
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
         {accounts.map(acc => (
            <div key={acc.id} className="executive-card relative overflow-hidden p-6 group">
               <div className="absolute top-0 left-0 w-1 h-full bg-brand-gold rounded-l-2xl"></div>
               <div className="flex justify-between items-start mb-4 pl-2">
                    <span className="text-xs font-medium text-brand-gold-dark border border-brand-gold/30 bg-brand-gold-light px-2 py-0.5 rounded-full">{acc.currency}</span>
                    <button
                        onClick={() => openEdit(acc)}
                        className="text-gray-300 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
               </div>
               
               <h3 className="text-sm font-medium text-gray-500 mb-2 truncate pl-2">{acc.name}</h3>
               <p className="text-3xl font-mono font-normal tracking-tight text-gray-900 pl-2 num-tabular">
                 {CURRENCY_SYMBOL[acc.currency] || '$'}{acc.currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
               </p>
            </div>
         ))}
         
         <button 
           onClick={() => openNew()}
           className="executive-card flex flex-col items-center justify-center p-6 text-gray-400 hover:border-brand-gold/60 hover:text-brand-gold-dark transition-all gap-3 min-h-[140px]"
         >
           <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
             <span className="text-2xl font-light text-gray-400">+</span>
           </div>
           <span className="text-sm font-medium text-gray-400">Nueva cuenta</span>
         </button>
       </div>

       {isOpen && (
         <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 p-6 w-full max-w-md shadow-2xl rounded-2xl border border-black/[0.06]">
               <div className="flex justify-between items-center mb-6">
                   <h3 className="text-base font-medium text-gray-900">{editing ? 'Editar cuenta' : 'Nueva cuenta'}</h3>
                   <button onClick={() => { setIsOpen(false); setEditing(null) }} className="text-gray-400 hover:text-gray-900 transition-colors text-lg">✕</button>
               </div>
               
               <form action={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Nombre de la cuenta</label>
                    <input 
                        type="text" 
                        name="name" 
                        defaultValue={editing?.name} 
                        className="w-full text-lg font-medium text-slate-900 placeholder:text-slate-300 border-0 border-b border-slate-200 bg-transparent py-2 px-0 focus:ring-0 focus:border-brand-military transition-colors outline-none"
                        placeholder="Ej. Banco Nación"
                        required 
                    />
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-500 mb-2">Moneda</label>
                     <div className="flex gap-2">
                        <label className="flex-1 cursor-pointer">
                            <input type="radio" name="currency" value="ARS" defaultChecked={!editing || editing.currency === 'ARS'} className="peer sr-only" />
                            <div className="text-center py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 peer-checked:border-brand-military peer-checked:text-brand-military-dark peer-checked:bg-brand-military-light transition-all">
                                Pesos (ARS)
                            </div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                            <input type="radio" name="currency" value="USD" defaultChecked={editing?.currency === 'USD'} className="peer sr-only" />
                            <div className="text-center py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 peer-checked:border-brand-military peer-checked:text-brand-military-dark peer-checked:bg-brand-military-light transition-all">
                                Dólares (USD)
                            </div>
                        </label>
                     </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      {editing && (
                          <button 
                            type="button" 
                            onClick={() => handleDelete(editing.id)}
                            className="mr-auto text-sm font-medium text-slate-400 hover:text-red-600"
                          >
                            Eliminar
                          </button>
                      )}
                      <button 
                        type="button" 
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="px-6 py-2.5 bg-brand-military text-white text-sm font-medium rounded-xl hover:bg-brand-military-dark transition-colors"
                      >
                        {editing ? 'Guardar cambios' : 'Crear cuenta'}
                      </button>
                  </div>
               </form>
            </div>
         </div>
       )}
    </div>
  )
}
