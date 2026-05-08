import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { preciosPorDistrito, tendenciaMercado, distribucionTipos, formatM2 } from '../../data/realData'

const periodos = ['1M', '3M', '6M', '1A']

export function AnalisisMercado() {
  const [periodo, setPeriodo] = useState('6M')
  const [tab, setTab] = useState<'distritos' | 'tendencia' | 'tipos'>('distritos')

  return (
    <div className="pb-24 min-h-screen bg-[#03132d]">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-[#d8e2ff] mb-1">Análisis de Mercado</h1>
        <p className="text-xs text-[#8c919d] mb-4">Lima Metropolitana</p>

        {/* Periodo selector */}
        <div className="flex gap-2 mb-4">
          {periodos.map(p => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                periodo === p
                  ? 'bg-[rgba(38,183,255,0.15)] text-[#26B7FF] border border-[rgba(38,183,255,0.3)]'
                  : 'glass text-[#8c919d]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 glass rounded-lg p-1 mb-4">
          {(['distritos', 'tendencia', 'tipos'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-md text-xs font-semibold capitalize transition-all ${
                tab === t ? 'bg-[rgba(38,183,255,0.15)] text-[#26B7FF]' : 'text-[#8c919d]'
              }`}
            >
              {t === 'distritos' ? 'Distritos' : t === 'tendencia' ? 'Tendencia' : 'Tipos'}
            </button>
          ))}
        </div>

        {/* Contenido por tab */}
        {tab === 'distritos' && (
          <div>
            <div className="glass rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-4">Precio/m² por Distrito</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={preciosPorDistrito} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 9, fill: '#8c919d' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="distrito" type="category" tick={{ fontSize: 9, fill: '#8c919d' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip
                    contentStyle={{ background: '#101f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number) => [formatM2(v), 'Precio/m²']}
                  />
                  <Bar dataKey="precioM2" fill="#26B7FF" radius={[0, 4, 4, 0]} fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2">
              {preciosPorDistrito.map(d => (
                <div key={d.distrito} className="glass rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#d8e2ff]">{d.distrito}</p>
                    <p className="text-xs text-[#8c919d]">{d.propiedades} propiedades</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#a7c8ff]">{formatM2(d.precioM2)}</p>
                    <div className={`flex items-center gap-1 justify-end text-xs font-semibold ${d.variacion >= 0 ? 'text-[#2fe0a2]' : 'text-[#ffb4ab]'}`}>
                      {d.variacion >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {d.variacion >= 0 ? '+' : ''}{d.variacion}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'tendencia' && (
          <div className="glass rounded-xl p-4">
            <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-4">Evolución Precio/m²</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={tendenciaMercado}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#8c919d' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#8c919d' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#101f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`S/. ${v.toLocaleString()}`, 'Precio/m²']}
                />
                <Line type="monotone" dataKey="precio" stroke="#26B7FF" strokeWidth={2} dot={{ fill: '#26B7FF', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 'tipos' && (
          <div className="flex flex-col gap-2">
            {distribucionTipos.map(t => (
              <div key={t.tipo} className="glass rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-[#d8e2ff]">{t.tipo}</p>
                  <p className="text-sm font-bold text-[#26B7FF]">{t.porcentaje}%</p>
                </div>
                <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#26B7FF] transition-all"
                    style={{ width: `${t.porcentaje}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#8c919d] mt-1">{t.cantidad.toLocaleString()} propiedades</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
