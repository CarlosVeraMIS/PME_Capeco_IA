import { Bell, TrendingUp, MapPin, Zap } from 'lucide-react'
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { StatCard } from '../../components/StatCard'
import { PropCard } from '../../components/PropCard'
import { propiedades, tendenciaMercado, estadisticasGlobales, formatSoles } from '../../data/realData'
import { useNavigate } from 'react-router-dom'

export function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="pb-24 min-h-screen bg-[#03132d]">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs text-[#8c919d]">Lima, Perú</p>
            <h1 className="text-xl font-bold text-[#d8e2ff]">Monitor RE IA</h1>
          </div>
          <button
            onClick={() => navigate('/alertas')}
            className="relative w-10 h-10 glass rounded-full flex items-center justify-center"
          >
            <Bell size={18} className="text-[#a7c8ff]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#26B7FF] rounded-full" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-4">
        <StatCard
          label="Precio/m² Lima"
          value={formatSoles(estadisticasGlobales.precioPromedioM2)}
          trend={estadisticasGlobales.varMensual}
          sub="este mes"
          accent="cyan"
        />
        <StatCard
          label="Propiedades"
          value={estadisticasGlobales.totalPropiedades.toLocaleString()}
          sub="activas en Lima"
          accent="green"
        />
      </div>

      {/* Tendencia chart */}
      <div className="mx-4 glass rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider">Tendencia Precio/m²</p>
            <p className="text-xs text-[#8c919d]">Últimos 7 meses</p>
          </div>
          <TrendingUp size={16} className="text-[#2fe0a2]" />
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={tendenciaMercado}>
            <defs>
              <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#26B7FF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#26B7FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#8c919d' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#101f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
              formatter={(v: number) => [`S/. ${v.toLocaleString()}`, 'Precio/m²']}
            />
            <Area type="monotone" dataKey="precio" stroke="#26B7FF" strokeWidth={2} fill="url(#gradCyan)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Hot district */}
      <div className="mx-4 mb-4">
        <div className="glass rounded-xl p-3 flex items-center gap-3 border border-[rgba(47,224,162,0.2)] glow-green">
          <div className="w-9 h-9 rounded-lg bg-[rgba(47,224,162,0.12)] flex items-center justify-center shrink-0">
            <Zap size={16} className="text-[#2fe0a2]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#2fe0a2]">Distrito más activo</p>
            <p className="text-sm font-bold text-[#d8e2ff]">{estadisticasGlobales.distritoHot}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-[#8c919d]">Var. mensual</p>
            <p className="text-sm font-bold text-[#2fe0a2]">+8.3%</p>
          </div>
        </div>
      </div>

      {/* Recent properties */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#26B7FF] uppercase tracking-wider">Recientes</p>
          <button onClick={() => navigate('/busqueda')} className="text-xs text-[#a7c8ff]">Ver todas →</button>
        </div>
        <div className="flex flex-col gap-3">
          {propiedades.slice(0, 3).map(prop => (
            <PropCard
              key={prop.id}
              prop={prop}
              onClick={() => navigate(`/propiedad/${prop.id}`)}
            />
          ))}
        </div>
      </div>

      {/* Map teaser */}
      <div className="mx-4 mt-4">
        <button
          onClick={() => navigate('/mapa')}
          className="w-full glass glass-hover rounded-xl p-4 flex items-center gap-3 transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-[rgba(38,183,255,0.12)] flex items-center justify-center">
            <MapPin size={16} className="text-[#26B7FF]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[#d8e2ff]">Ver Mapa de Calor</p>
            <p className="text-xs text-[#8c919d]">Análisis geoespacial de Lima</p>
          </div>
          <span className="ml-auto text-[#26B7FF]">→</span>
        </button>
      </div>
    </div>
  )
}
