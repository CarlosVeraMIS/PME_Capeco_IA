import { type ReactNode } from 'react'
import clsx from 'clsx'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: number
  icon?: ReactNode
  accent?: 'cyan' | 'green' | 'primary' | 'error'
}

const accentMap = {
  cyan: 'text-[#26B7FF]',
  green: 'text-[#2fe0a2]',
  primary: 'text-primary',
  error: 'text-error',
}

export function StatCard({ label, value, sub, trend, icon, accent = 'cyan' }: StatCardProps) {
  return (
    <div className="glass rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#c2c6d3] uppercase tracking-wider">{label}</span>
        {icon && <span className={clsx('opacity-70', accentMap[accent])}>{icon}</span>}
      </div>
      <span className={clsx('text-2xl font-bold', accentMap[accent])}>{value}</span>
      {(sub || trend !== undefined) && (
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <span className={clsx('text-xs font-semibold', trend >= 0 ? 'text-[#2fe0a2]' : 'text-[#ffb4ab]')}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
            </span>
          )}
          {sub && <span className="text-xs text-[#8c919d]">{sub}</span>}
        </div>
      )}
    </div>
  )
}
