import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { StatCard } from '../../components/StatCard'
import { Badge } from '../../components/Badge'
import {
  propiedades, tendenciaMercado, preciosPorDistrito,
  estadisticasGlobales, formatSoles, formatM2
} from '../../data/realData'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Activity, Clock } from 'lucide-react'

export function DashboardDesktop() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto h-full">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#d8e2ff]">Dashboard</h1>
          <p className="text-sm text-[#8c919d]">Lima, Perú — Actualizado hoy</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-[#2fe0a2]">
            <Activity size={12} /> Mercado activo
          </span>
          <button
            onClick={() => navigate('/busqueda')}
            className="px-4 py-2 rounded-lg bg-[rgba(38,183,255,0.12)] text-[#26B7FF] text-sm font-semibold border border-[rgba(38,183,255,0.25)]"
          >
            Nueva búsqueda
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Precio/m² Lima" value={formatM2(estadisticasGlobales.precioPromedioM2)} trend={estadisticasGlobales.varMensual} sub="vs mes anterior" accent="cyan" icon={<TrendingUp size={16} />} />
        <StatCard label="Propiedades activas" value={estadisticasGlobales.totalPropiedades.toLocaleString()} sub="en toda Lima" accent="primary" />
        <StatCard label="Unidades disponibles" value={estadisticasGlobales.unidadesDisponibles.toLocaleString()} sub="activas en el mercado" accent="green" />
        <StatCard label="Volumen total" value={estadisticasGlobales.volumenTotal} sub="mes en curso" accent="cyan" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Tendencia */}
        <div className="col-span-2 glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider">Tendencia Precio/m²</p>
              <p className="text-xs text-[#8c919d]">Últimos 7 meses — Lima Metropolitana</p>
            </div>
            <div className="flex items-center gap-1 text-[#2fe0a2] text-sm font-semibold">
              <TrendingUp size={14} /> +{estadisticasGlobales.varMensual}%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={tendenciaMercado}>
              <defs>
                <linearGradient id="gradCyanD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#26B7FF" stopOpacity={0.25} />
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
              <Area type="monotone" dataKey="precio" stroke="#26B7FF" strokeWidth={2} fill="url(#gradCyanD)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Distritos top */}
        <div className="glass rounded-xl p-5">
          <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-4">Top Distritos</p>
          <div className="flex flex-col gap-2">
            {preciosPorDistrito.slice(0, 5).map((d, i) => (
              <div key={d.distrito} className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#424751] w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#d8e2ff] truncate">{d.distrito}</p>
                  <div className="h-1 bg-[rgba(255,255,255,0.06)] rounded-full mt-1">
                    <div className="h-full rounded-full bg-[#26B7FF]" style={{ width: `${(d.precioM2 / 10000) * 100}%`, opacity: 0.8 }} />
                  </div>
                </div>
                <span className="text-xs font-bold text-[#a7c8ff] shrink-0">{(d.precioM2 / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Volumen */}
        <div className="glass rounded-xl p-5">
          <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-4">Unidades Disponibles</p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={tendenciaMercado}>
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#101f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [v, 'Unidades disponibles']}
              />
              <Bar dataKey="unidades" fill="#2fe0a2" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recientes */}
        <div className="col-span-2 glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider">Propiedades Recientes</p>
            <button onClick={() => navigate('/busqueda')} className="text-xs text-[#a7c8ff]">Ver todas →</button>
          </div>
          <div className="flex flex-col gap-2">
            {propiedades.slice(0, 4).map(prop => (
              <div
                key={prop.id}
                onClick={() => navigate(`/propiedad/${prop.id}`)}
                className="flex items-center gap-3 p-2 rounded-lg glass-hover cursor-pointer transition-all"
              >
                <img src={prop.imagen} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#d8e2ff] truncate">{prop.titulo}</p>
                  <p className="text-xs text-[#8c919d]">{prop.distrito}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#26B7FF]">{formatSoles(prop.precio)}</p>
                  <Badge label={prop.estado} />
                </div>
                <div className="flex items-center gap-1 text-[#2fe0a2] shrink-0">
                  <Clock size={11} />
                  <span className="text-xs">{prop.fechaPublicacion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
