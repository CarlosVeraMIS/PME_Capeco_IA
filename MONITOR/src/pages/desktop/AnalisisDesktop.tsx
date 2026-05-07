import { useState } from 'react'
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { preciosPorDistrito, tendenciaMercado, distribucionTipos, formatM2, formatSoles } from '../../data/realData'

const periodos = ['1M', '3M', '6M', '1A', '2A']

export function AnalisisDesktop() {
  const [periodo, setPeriodo] = useState('6M')

  return (
    <div className="p-6 overflow-y-auto h-full flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#d8e2ff]">Análisis de Mercado</h1>
          <p className="text-sm text-[#8c919d]">Lima Metropolitana — datos en tiempo real</p>
        </div>
        <div className="flex gap-2">
          {periodos.map(p => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                periodo === p
                  ? 'bg-[rgba(38,183,255,0.15)] text-[#26B7FF] border border-[rgba(38,183,255,0.3)]'
                  : 'glass text-[#8c919d] hover:text-[#c2c6d3]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Top charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Evolución precio */}
        <div className="glass rounded-xl p-5">
          <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-1">Evolución Precio/m²</p>
          <p className="text-xs text-[#8c919d] mb-4">Promedio Lima — últimos 7 meses</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={tendenciaMercado}>
              <defs>
                <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#26B7FF" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#26B7FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#101f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [formatSoles(v), 'Precio/m²']}
              />
              <Area type="monotone" dataKey="precio" stroke="#26B7FF" strokeWidth={2} fill="url(#gradA)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Precio por distrito */}
        <div className="glass rounded-xl p-5">
          <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-1">Precio/m² por Distrito</p>
          <p className="text-xs text-[#8c919d] mb-4">Ranking actualizado</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={preciosPorDistrito} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="distrito" type="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                contentStyle={{ background: '#101f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [formatM2(v), '']}
              />
              <Bar dataKey="precioM2" fill="#26B7FF" radius={[0, 4, 4, 0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Volumen */}
        <div className="glass rounded-xl p-5">
          <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-4">Unidades Disponibles</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={tendenciaMercado}>
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#101f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="unidades" fill="#2fe0a2" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución tipos */}
        <div className="glass rounded-xl p-5">
          <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-4">Distribución por Tipo</p>
          <div className="flex flex-col gap-3">
            {distribucionTipos.map(t => (
              <div key={t.tipo}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#c2c6d3]">{t.tipo}</span>
                  <span className="text-xs font-bold text-[#a7c8ff]">{t.porcentaje}%</span>
                </div>
                <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full">
                  <div className="h-full rounded-full bg-[#26B7FF]" style={{ width: `${t.porcentaje}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Variaciones */}
        <div className="glass rounded-xl p-5">
          <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-4">Variaciones Mensuales</p>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-48">
            {preciosPorDistrito.map(d => (
              <div key={d.distrito} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <span className="text-xs text-[#c2c6d3]">{d.distrito}</span>
                <div className={`flex items-center gap-1 text-xs font-semibold ${d.variacion >= 0 ? 'text-[#2fe0a2]' : 'text-[#ffb4ab]'}`}>
                  {d.variacion >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {d.variacion >= 0 ? '+' : ''}{d.variacion}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
