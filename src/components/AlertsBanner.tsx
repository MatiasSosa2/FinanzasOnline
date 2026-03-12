type AlertSeverity = 'danger' | 'warning' | 'info'

export interface AlertItem {
  severity: AlertSeverity
  title: string
  message: string
  icon: 'runway' | 'margin' | 'spike'
}

const ICONS: Record<AlertItem['icon'], React.ReactNode> = {
  runway: (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  margin: (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  spike: (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  ),
}

const SEVERITY_STYLES: Record<AlertSeverity, { bar: string; badge: string; icon: string; text: string; border: string }> = {
  danger: {
    bar:    'bg-red-50 border-red-200',
    badge:  'bg-red-100 text-red-700 border-red-200',
    icon:   'text-red-500',
    text:   'text-red-800',
    border: 'border-l-red-500',
  },
  warning: {
    bar:    'bg-amber-50 border-amber-200',
    badge:  'bg-amber-100 text-amber-800 border-amber-200',
    icon:   'text-amber-600',
    text:   'text-amber-900',
    border: 'border-l-amber-500',
  },
  info: {
    bar:    'bg-brand-slate border-gray-200',
    badge:  'bg-white text-brand-military border-gray-200',
    icon:   'text-brand-military',
    text:   'text-gray-700',
    border: 'border-l-brand-military',
  },
}

export default function AlertsBanner({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) return null

  return (
    <div className="mb-6 flex flex-col gap-2">
      {alerts.map((alert, i) => {
        const s = SEVERITY_STYLES[alert.severity]
        return (
          <div
            key={i}
            className={`flex items-start gap-3 px-5 py-3.5 rounded border ${s.bar} border-l-4 ${s.border}`}
          >
            {/* Ícono */}
            <span className={`mt-0.5 ${s.icon}`}>{ICONS[alert.icon]}</span>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <span className={`text-[9px] font-semibold uppercase tracking-[0.18em] ${s.text}`}>
                {alert.title}&ensp;
              </span>
              <span className={`text-[10px] ${s.text} opacity-80`}>{alert.message}</span>
            </div>

            {/* Badge severidad */}
            <span className={`text-[8px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-sm border ${s.badge} shrink-0 self-center`}>
              {alert.severity === 'danger' ? 'Crítico' : alert.severity === 'warning' ? 'Atención' : 'Info'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
