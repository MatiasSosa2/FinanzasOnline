'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

type Preset = 'mes' | 'trim' | 'anio' | '12m' | 'todo'

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'mes',  label: 'Este mes'   },
  { key: 'trim', label: 'Trimestre'  },
  { key: 'anio', label: 'Este año'   },
  { key: '12m',  label: '12 meses'   },
  { key: 'todo', label: 'Todo'       },
]

function getRange(preset: Preset): { from?: string; to?: string } {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  if (preset === 'mes') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { from: fmt(from), to: fmt(to) }
  }
  if (preset === 'trim') {
    const from = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    return { from: fmt(from), to: fmt(now) }
  }
  if (preset === 'anio') {
    const from = new Date(now.getFullYear(), 0, 1)
    return { from: fmt(from), to: fmt(now) }
  }
  if (preset === '12m') {
    const from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    return { from: fmt(from), to: fmt(now) }
  }
  return {} // 'todo' — sin filtro
}

export default function PeriodFilter() {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()
  const active       = (searchParams.get('preset') || '12m') as Preset

  const setPreset = useCallback(
    (preset: Preset) => {
      const range  = getRange(preset)
      const params = new URLSearchParams()
      params.set('preset', preset)
      if (range.from) params.set('from', range.from)
      if (range.to)   params.set('to',   range.to)
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname],
  )

  return (
    <div className="print:hidden flex items-center gap-1">
      {PRESETS.map(p => (
        <button
          key={p.key}
          onClick={() => setPreset(p.key)}
          className={`text-[9px] font-medium uppercase tracking-widest px-3 py-1.5 rounded-sm border transition-colors ${
            active === p.key
              ? 'bg-brand-military text-white border-brand-military'
              : 'text-gray-400 border-gray-200 hover:text-brand-military hover:border-brand-military bg-white'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
