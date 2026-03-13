import { getAccounts, getCategories, getTransactions, getMonthlyStats, getWeeklyStats, getDailyStats, getContacts, getAreasNegocio, getCreditosDeudas } from '@/app/actions'
import AccountManager from '@/components/AccountManager'
import MonthlySummary from '@/components/MonthlySummary'
import ContactManager from '@/components/ContactManager'
import AreaNegocioManager from '@/components/AreaNegocioManager'
import TransactionList from '@/components/TransactionList'
import TransactionFormCard from '@/components/TransactionFormCard'
import { DonutChart, Sparkline, StackedAreaChart } from '@/components/ReportCharts'
import AlertsBanner from '@/components/AlertsBanner'
import type { AlertItem } from '@/components/AlertsBanner'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const accounts = await getAccounts()
  const categories = await getCategories()
  const transactions = await getTransactions()
  const monthlyStats = await getMonthlyStats()
  const weeklyStats = await getWeeklyStats()
  const dailyStats = await getDailyStats()
  const contacts = await getContacts()
  const areas = await getAreasNegocio()
  const creditosDeudas = await getCreditosDeudas()

  const CURRENCY_SYMBOL: Record<string, string> = { ARS: '$', USD: 'US$' }

  // Donut: top categorías de gasto del mes actual
  const nowDate = new Date()
  const mesActual = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`
  const categoryExpMap: Record<string, { name: string; value: number }> = {}
  for (const tx of transactions) {
    const txMes = `${new Date(tx.date).getFullYear()}-${String(new Date(tx.date).getMonth() + 1).padStart(2, '0')}`
    if (txMes !== mesActual || tx.type !== 'EXPENSE') continue
    const catName = (tx as { category?: { name: string } }).category?.name || 'Sin categoría'
    if (!categoryExpMap[catName]) categoryExpMap[catName] = { name: catName, value: 0 }
    categoryExpMap[catName].value += tx.amount
  }
  const CAT_COLORS = ['#3A4D39', '#C5A065', '#5A7A57', '#d4ae84', '#6b8f65', '#c49a6c']
  const categorySlices = Object.values(categoryExpMap)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map((c, i) => ({ ...c, color: CAT_COLORS[i % CAT_COLORS.length] }))

  const balanceByCurrency: Record<string, number> = {}
  accounts.forEach(acc => {
    const cur = acc.currency || 'ARS'
    balanceByCurrency[cur] = (balanceByCurrency[cur] || 0) + acc.currentBalance
  })

  // --- Alertas automáticas ---
  const monthlyAgg: Record<string, { income: number; expense: number }> = {}
  for (const tx of transactions) {
    const d = new Date(tx.date)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthlyAgg[k]) monthlyAgg[k] = { income: 0, expense: 0 }
    if (tx.type === 'INCOME') monthlyAgg[k].income += tx.amount
    else monthlyAgg[k].expense += tx.amount
  }
  const tKey = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`
  const lDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1)
  const lKey = `${lDate.getFullYear()}-${String(lDate.getMonth() + 1).padStart(2, '0')}`
  const thisMth = monthlyAgg[tKey] || { income: 0, expense: 0 }
  const lastMth = monthlyAgg[lKey] || { income: 0, expense: 0 }

  // Sparklines — últimos 6 meses
  const last6Keys = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - (5 - idx), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const incomeSpark = last6Keys.map(k => monthlyAgg[k]?.income || 0)
  const expenseSpark = last6Keys.map(k => monthlyAgg[k]?.expense || 0)
  const balanceSpark = last6Keys.map(k => (monthlyAgg[k]?.income || 0) - (monthlyAgg[k]?.expense || 0))

  // Pulse KPIs — mes actual ARS
  const arsMonthly = monthlyStats.find(s => s.currency === 'ARS') || { income: 0, expense: 0, balance: 0, currency: 'ARS' }
  const incomeGrowth = lastMth.income > 0 ? ((arsMonthly.income - lastMth.income) / lastMth.income) * 100 : null
  const expenseGrowth = lastMth.expense > 0 ? ((arsMonthly.expense - lastMth.expense) / lastMth.expense) * 100 : null
  const marginPct = arsMonthly.income > 0 ? ((arsMonthly.income - arsMonthly.expense) / arsMonthly.income) * 100 : 0

  const arsBalance = balanceByCurrency['ARS'] || 0
  const last3Keys = [1, 2, 3].map(i => {
    const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const avgExp3m = last3Keys.reduce((s, k) => s + (monthlyAgg[k]?.expense || 0), 0) / 3
  const runwayMths = avgExp3m > 0 ? arsBalance / avgExp3m : null
  const marginPctAlert = thisMth.income > 0
    ? ((thisMth.income - thisMth.expense) / thisMth.income) * 100
    : null

  const alerts: AlertItem[] = []
  if (runwayMths !== null && runwayMths < 3) {
    alerts.push({
      severity: runwayMths < 1.5 ? 'danger' : 'warning',
      icon: 'runway',
      title: 'Runway bajo',
      message: `Con el ritmo actual de gastos, el saldo ARS cubre solo ${runwayMths.toFixed(1)} meses. Revisá la liquidez.`,
    })
  }
  if (marginPctAlert !== null && marginPctAlert < 20) {
    alerts.push({
      severity: marginPctAlert < 0 ? 'danger' : 'warning',
      icon: 'margin',
      title: 'Margen reducido',
      message: `El margen del mes es ${marginPctAlert.toFixed(1)}%. Analizá costos en Reportes.`,
    })
  }
  if (lastMth.expense > 0 && thisMth.expense > lastMth.expense * 1.2) {
    const spikePct = ((thisMth.expense - lastMth.expense) / lastMth.expense) * 100
    alerts.push({
      severity: spikePct > 50 ? 'danger' : 'warning',
      icon: 'spike',
      title: 'Gastos en alza',
      message: `Los gastos subieron un ${spikePct.toFixed(0)}% respecto al mes anterior.`,
    })
  }

  // ── Semáforo de créditos ──
  const now48h = new Date(nowDate.getTime() + 48 * 60 * 60 * 1000)
  const credVencidos = creditosDeudas.filter(c => c.estado === 'VENCIDO' || (c.fechaVencimiento && new Date(c.fechaVencimiento) < nowDate && c.estado === 'PENDIENTE'))
  const cred48h = creditosDeudas.filter(c => c.estado === 'PENDIENTE' && c.fechaVencimiento && new Date(c.fechaVencimiento) >= nowDate && new Date(c.fechaVencimiento) <= now48h)
  const credFuturos = creditosDeudas.filter(c => c.estado === 'PENDIENTE' && (!c.fechaVencimiento || new Date(c.fechaVencimiento) > now48h))
  const totalVencido = credVencidos.reduce((s, c) => s + c.amount, 0)
  const total48h = cred48h.reduce((s, c) => s + c.amount, 0)
  const totalFuturo = credFuturos.reduce((s, c) => s + c.amount, 0)
  const totalDeudaPendiente = creditosDeudas.filter(c => c.estado === 'PENDIENTE' || c.estado === 'VENCIDO').reduce((s, c) => s + c.amount, 0)

  // ── Stacked Area — últimos 6 meses ──
  const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const stackedData = last6Keys.map(k => {
    const d = new Date(k + '-01')
    return {
      label: MONTH_LABELS[d.getMonth()],
      ingresos: monthlyAgg[k]?.income || 0,
      egresos: monthlyAgg[k]?.expense || 0,
    }
  })

  // ── Weekly income (ARS) ──
  const arsWeekly = weeklyStats.find(s => s.currency === 'ARS') || { income: 0, expense: 0, balance: 0 }
  const ingresoSemanalGrowth = arsMonthly.income > 0 ? ((arsWeekly.income / arsMonthly.income) * 100) : null

  return (
    <div className="p-6 max-w-[1920px] mx-auto font-sans text-gray-800 min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-archivo), Archivo, system-ui' }}>Panel de Control</h1>
          <p className="text-sm text-gray-400 mt-0.5">Visión financiera consolidada &middot; {nowDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</p>
        </div>
        {/* Saldo total por moneda — tarjetas tipo billetera */}
        <div className="flex items-center gap-3">
          {Object.entries(balanceByCurrency).map(([currency, total]) => {
            const prevTotal = last3Keys.reduce((s, k) => s + (monthlyAgg[k]?.income || 0) - (monthlyAgg[k]?.expense || 0), 0) / 3
            const badge = currency === 'ARS' && arsMonthly.income > 0
              ? ((arsMonthly.income - lastMth.income) / (lastMth.income || 1) * 100)
              : null
            return (
              <div key={currency} className="executive-card px-5 py-3 flex items-center gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-0.5">Total {currency}</p>
                  <p className="text-2xl font-mono font-normal text-gray-900 leading-none num-tabular">
                    {CURRENCY_SYMBOL[currency] || '$'}{total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                {badge !== null && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {badge >= 0 ? '+' : ''}{badge.toFixed(1)}% vs mes ant.
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </header>

      {/* ALERTAS */}
      <AlertsBanner alerts={alerts} />


      {/* ── FILA 1: 3 KPI CARDS ─────────────────────────────────────────────── */}
      <section className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* KPI: Disponible ARS */}
        <div className="executive-card p-5">
          <p className="text-xs font-medium text-gray-400 mb-2">Disponible</p>
          <p className="text-3xl font-mono font-normal text-gray-900 num-tabular leading-none mb-1">
            ${arsBalance.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Saldo total cuentas ARS</p>
          <Sparkline data={balanceSpark} color="#2D6A4F" />
        </div>

        {/* KPI: Ingreso Semanal */}
        <div className="executive-card p-5">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium text-gray-400">Ingreso semanal</p>
            {ingresoSemanalGrowth !== null && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                {ingresoSemanalGrowth.toFixed(0)}% del mes
              </span>
            )}
          </div>
          <p className="text-3xl font-mono font-normal text-gray-900 num-tabular leading-none mb-1">
            ${arsWeekly.income.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Esta semana · ARS</p>
          <Sparkline data={incomeSpark} color="#2D6A4F" />
        </div>

        {/* KPI: Deuda Pendiente */}
        <div className="executive-card p-5">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium text-gray-400">Deuda pendiente</p>
            {credVencidos.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                {credVencidos.length} vencido{credVencidos.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className={`text-3xl font-mono font-normal num-tabular leading-none mb-1 ${totalDeudaPendiente > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            ${totalDeudaPendiente.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Créditos y deudas pendientes</p>
          <a href="/creditos" className="text-xs font-medium text-emerald-700 hover:underline">Ver todos →</a>
        </div>

      </section>

      {/* ── FILA 2: Gráfico área (60%) + Donut (40%) ─────────────────────── */}
      <div className="mb-5 grid grid-cols-1 lg:grid-cols-[6fr_4fr] gap-4">

        {/* Gráfico de rendimiento — Stacked Area */}
        <div className="executive-card flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-black/[0.05] flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Rendimiento mensual</h2>
              <p className="text-xs text-gray-400">Ingresos vs egresos — últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />Ingresos</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />Egresos</span>
            </div>
          </div>
          <div className="p-4 flex-1">
            {stackedData.some(d => d.ingresos > 0 || d.egresos > 0) ? (
              <StackedAreaChart data={stackedData} symbol="$" />
            ) : (
              <div className="h-[220px] flex items-center justify-center">
                <p className="text-sm text-gray-300">Sin datos históricos aún</p>
              </div>
            )}
          </div>
        </div>

        {/* Donut — distribución gastos del mes */}
        <div className="executive-card flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-black/[0.05] flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700">Gastos por categoría</h2>
            <p className="text-xs text-gray-400">Este mes</p>
          </div>
          {categorySlices.length > 0 ? (
            <div className="p-4 flex flex-col gap-3 flex-1">
              <DonutChart slices={categorySlices} />
              <div className="flex flex-col gap-1.5">
                {categorySlices.map(s => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-xs text-gray-600 truncate max-w-[130px]">{s.name}</span>
                    </div>
                    <span className="text-xs font-mono text-gray-700 num-tabular">${s.value.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
              <svg className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
              <p className="text-sm text-gray-400">Sin gastos categorizados este mes</p>
            </div>
          )}
        </div>

      </div>

      {/* ── FILA 3: Últimos movimientos (50%) + Semáforo créditos (50%) ────── */}
      <div className="mb-5 grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Últimos 5 movimientos */}
        <div className="executive-card flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-black/[0.05] flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700">Últimos movimientos</h2>
            <span className="text-xs text-gray-400">{dailyStats.txHoy.length > 0 ? `${dailyStats.txHoy.length} hoy` : 'Sin mov. hoy'}</span>
          </div>
          {transactions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
              <svg className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              <p className="text-sm text-gray-400">Aún no hay ventas hoy.</p>
              <p className="text-xs text-gray-300">¡Registrá tu primera operación!</p>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.04]">
              {transactions.slice(0, 7).map((tx, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/60 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{tx.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(tx.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      {(tx as {category?: {name:string}}).category?.name && ` · ${(tx as {category?: {name:string}}).category?.name}`}
                    </p>
                  </div>
                  <p className={`text-sm font-mono font-normal num-tabular ml-4 shrink-0 ${tx.type === 'INCOME' ? 'text-emerald-700' : 'text-gray-500'}`}>
                    {tx.type === 'INCOME' ? '+' : '−'}${tx.amount.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Semáforo de vencimientos */}
        <div className="executive-card flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-black/[0.05] flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700">Semáforo de vencimientos</h2>
            <a href="/creditos" className="text-xs font-medium text-emerald-700 hover:underline">Ver todos →</a>
          </div>
          <div className="p-5 flex flex-col gap-3 flex-1">
            {creditosDeudas.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm text-gray-400">Sin créditos pendientes</p>
              </div>
            ) : (
              <>
                {/* ROJO — Vencidos */}
                <div className={`rounded-xl p-4 flex items-center justify-between ${credVencidos.length > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${credVencidos.length > 0 ? 'bg-red-500' : 'bg-gray-200'}`} />
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Vencidos</p>
                      <p className="text-[11px] text-gray-400">{credVencidos.length} registro{credVencidos.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <p className={`text-base font-mono font-normal num-tabular ${credVencidos.length > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                    ${totalVencido.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                {/* AMARILLO — Vencen en 48hs */}
                <div className={`rounded-xl p-4 flex items-center justify-between ${cred48h.length > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${cred48h.length > 0 ? 'bg-amber-400' : 'bg-gray-200'}`} />
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Vencen en 48hs</p>
                      <p className="text-[11px] text-gray-400">{cred48h.length} registro{cred48h.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <p className={`text-base font-mono font-normal num-tabular ${cred48h.length > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                    ${total48h.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                {/* VERDE — Futuros */}
                <div className={`rounded-xl p-4 flex items-center justify-between ${credFuturos.length > 0 ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${credFuturos.length > 0 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Pendientes a futuro</p>
                      <p className="text-[11px] text-gray-400">{credFuturos.length} registro{credFuturos.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <p className={`text-base font-mono font-normal num-tabular ${credFuturos.length > 0 ? 'text-emerald-700' : 'text-gray-300'}`}>
                    ${totalFuturo.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* ── FILA 4: Cuentas — ancho completo ────────────────────────────────── */}
      <div className="mb-5 executive-card">
        <div className="px-5 py-3.5 border-b border-black/[0.05] flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700">Cuentas</h3>
          <p className="text-xs text-gray-400">{accounts.length} cuenta{accounts.length !== 1 ? 's' : ''} registrada{accounts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="p-5">
          <AccountManager accounts={accounts} />
        </div>
      </div>

      {/* ── FILA 5: Formulario + Directorio ─────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TransactionFormCard accounts={accounts} categories={categories} contacts={contacts} areas={areas} />
        <div className="executive-card flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-black/[0.05]">
            <h3 className="text-sm font-semibold text-gray-700">Directorio de contactos</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ContactManager contacts={contacts} />
          </div>
        </div>
      </div>

      {/* ── FILA 6: Áreas de negocio ─────────────────────────────────────────── */}
      <div className="executive-card flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-black/[0.05]">
          <h3 className="text-sm font-semibold text-gray-700">Áreas de negocio</h3>
        </div>
        <div className="p-4">
          <AreaNegocioManager areas={areas} />
        </div>
      </div>

    </div>
  )
}
