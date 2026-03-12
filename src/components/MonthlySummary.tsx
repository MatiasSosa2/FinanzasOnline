'use client'

import React from 'react'

const CURRENCY_SYMBOL: Record<string, string> = { ARS: '$', USD: 'US$' }

type Props = {
  stats: {
    income: number
    expense: number
    balance: number
    currency: string
  }[]
}

export default function MonthlySummary({ stats }: Props) {
  return (
    <div className="space-y-4">
      {stats.map((stat) => {
        const margin = stat.income > 0 ? ((stat.income - stat.expense) / stat.income) * 100 : 0
        const marginPositive = margin >= 0
        return (
        <div key={stat.currency} className="overflow-hidden">
          {/* Badge moneda */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm font-medium text-gray-500">Moneda</span>
            <span className="text-xs font-medium text-brand-military border border-brand-military/30 bg-brand-military-light px-3 py-1 rounded-full">{stat.currency}</span>
          </div>

          {/* Ingresos / Gastos */}
          <div className="grid grid-cols-2 gap-3 mb-3">
             <div className="p-4 bg-brand-military-light rounded-xl">
                <p className="text-sm font-medium text-brand-military-dark mb-2">Ingresos</p>
                <p className="text-2xl font-mono font-light text-brand-military-dark tracking-tight">
                  {CURRENCY_SYMBOL[stat.currency]}{stat.income.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                </p>
             </div>
             <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-500 mb-2">Gastos</p>
                <p className="text-2xl font-mono font-light text-gray-700 tracking-tight">
                  {CURRENCY_SYMBOL[stat.currency]}{stat.expense.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                </p>
             </div>
          </div>

          {/* Margen */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl mb-3">
            <p className="text-sm font-medium text-gray-500">Margen neto</p>
            <p className={`text-base font-mono font-normal tracking-tight ${ marginPositive ? 'text-brand-military-dark' : 'text-brand-oxide'}`}>
              {marginPositive ? '+' : ''}{margin.toFixed(1)}%
            </p>
          </div>
           
          {/* Balance total */}
          <div className="bg-brand-carbon px-4 py-4 rounded-xl flex items-center justify-between">
              <p className="text-sm font-medium text-brand-gold">Balance {stat.currency}</p>
              <p className="text-2xl font-mono font-light text-white tracking-tight">
                 {stat.balance >= 0 ? '+' : ''}{CURRENCY_SYMBOL[stat.currency]}{stat.balance.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </p>
           </div>
        </div>
        )
      })}
      
      {stats.length === 0 && (
         <p className="text-xs text-gray-400 text-center py-6 font-medium">Sin datos del mes</p>
      )}
    </div>
  )
}
