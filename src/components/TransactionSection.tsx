'use client'

import { useOptimistic, useTransition, useState } from 'react'
import TransactionForm from './TransactionForm'
import TransactionList from './TransactionList'
import type { Account, Category, Contact, AreaNegocio } from './TransactionForm'
import { createTransaction, deleteTransaction } from '@/app/actions'

type Transaction = {
  id: string
  description: string
  amount: number
  currency: string
  date: Date
  type: string
  account: { name: string }
  category: { name: string } | null
  contact: { name: string } | null
  areaNegocio: { nombre: string } | null
}

type OptimisticAction =
  | { type: 'add'; tx: Transaction }
  | { type: 'delete'; id: string }

export default function TransactionSection({
  transactions,
  accounts,
  categories,
  contacts,
  areas,
}: {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  contacts: Contact[]
  areas: AreaNegocio[]
}) {
  const [activeTab, setActiveTab] = useState<'INCOME' | 'EXPENSE'>('INCOME')

  const [optimisticTxs, dispatch] = useOptimistic(
    transactions,
    (state: Transaction[], action: OptimisticAction) => {
      if (action.type === 'add') {
        return [action.tx, ...state]
      }
      if (action.type === 'delete') {
        return state.filter(t => t.id !== action.id)
      }
      return state
    }
  )

  const [, startTransition] = useTransition()

  const handleCreate = async (formData: FormData) => {
    // Generate optimistic transaction
    const newTx: Transaction = {
      id: Math.random().toString(),
      description: (formData.get('description') as string) || 'Sin descripción',
      amount: parseFloat(formData.get('amount') as string) || 0,
      currency: (formData.get('currency') as string) || 'ARS',
      date: new Date(formData.get('date') as string),
      type: formData.get('type') as string,
      account: { name: accounts.find(a => a.id === formData.get('accountId'))?.name || 'Cuenta' },
      category: { name: categories.find(c => c.id === formData.get('categoryId'))?.name || 'General' },
      contact: { name: contacts.find(c => c.id === formData.get('contactId'))?.name || '-' },
      areaNegocio: areas.find(a => a.id === formData.get('areaNegocioId')) ? { nombre: areas.find(a => a.id === formData.get('areaNegocioId'))!.nombre } : null,
    }

    startTransition(() => {
        dispatch({ type: 'add', tx: newTx })
    })

    const result = await createTransaction(formData)
    return result
  }

  const handleDelete = async (id: string) => {
      startTransition(() => {
          dispatch({ type: 'delete', id })
      })
      await deleteTransaction(id)
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* COLUMNA 1: FORMULARIO - Serio y Funcional */}
        <div className="bg-white border-2 border-slate-200 shadow-sm flex flex-col h-full">
            <div className="bg-slate-50 p-4 border-b-2 border-slate-200 flex justify-between items-center">
                 <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">
                    {activeTab === 'INCOME' ? 'Registrar Ingreso' : 'Registrar Gasto'}
                </h2>
                <div className="flex bg-slate-200 p-0.5">
                    <button 
                        onClick={() => setActiveTab('INCOME')}
                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'INCOME' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Ingreso
                    </button>
                    <button 
                        onClick={() => setActiveTab('EXPENSE')}
                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'EXPENSE' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Gasto
                    </button>
                </div>
            </div>
            
            <div className="p-6 flex-1">
               <TransactionForm 
                    accounts={accounts} 
                    categories={categories} 
                    contacts={contacts}
                    areas={areas}
                    onSubmit={handleCreate}
                    initialType={activeTab}
                    onTypeChange={setActiveTab}
               />
            </div>
        </div>

        {/* COLUMNA 2: HISTORIAL - Serio y Ordenado */}
        <div className="bg-white border-2 border-slate-200 shadow-sm flex flex-col h-[600px]">
             <div className="bg-slate-50 p-4 border-b-2 border-slate-200 flex justify-between items-center">
                 <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Últimos Movimientos</h2>
                 <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                 <TransactionList transactions={optimisticTxs} onDelete={handleDelete} />
             </div>
             
             <div className="p-3 border-t-2 border-slate-100 bg-slate-50/50 text-center">
                <button className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-800">
                    Ver Historial Completo
                </button>
             </div>
        </div>
    </div>
  )
}
