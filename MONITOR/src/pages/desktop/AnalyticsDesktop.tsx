import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ScatterChart, Scatter, ZAxis, PieChart, Pie, Cell
} from 'recharts'
import { preciosPorDistrito, tendenciaMercado, distribucionTipos } from '../../data/capecoData'
import { StatCard } from '../../components/StatCard'
import { BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react'

const COLORS = ['#26B7FF', '#2fe0a2', '#a7c8ff', '#ffb4ab', '#88ceff']

const scatterData = preciosPorDistrito.map(d => ({
  x: d.precioM2,
  y: d.variacion,
  z: d.propiedades,
  name: d.distrito,
}))

export function AnalyticsDesktop() {
  return (
    <div className="p-6 overflow-y-auto h-full flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#d8e2ff]">Analytics & Reports</h1>
          <p className="text-sm text-[#8c919d]">Inteligencia de mercado avanzada</p>
        </div>
        <div className="flex gap-2">
          <button className="glass px-4 py-2 rounded-lg text-sm text-[#c2c6d3] flex items-center gap-2">
            <BarChart3 size={14} /> Exportar
          </button>
          <button className="glass px-4 py-2 rounded-lg text-sm text-[#26B7FF] border border-[rgba(38,183,255,0.3)] flex items-center gap-2">
            <TrendingUp size={14} /> Reporte IA
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Índice de Demanda" value="8.4/10" sub="Alta demanda" accent="cyan" />
        <StatCard label="Absorción mensual" value="12.3%" trend={1.8} sub="vs mes ant." accent="green" />
        <StatCard label="Días en mercado" value="42 días" trend={-5.2} sub="mediana" accent="primary" />
        <StatCard label="Precio oferta/cierre" value="96.8%" sub="ratio negociación" accent="cyan" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Precio + Volumen combinado */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-[#26B7FF]" />
            <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider">Precio & Unidades Disponibles</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={tendenciaMercado}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#101f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Bar yAxisId="right" dataKey="unidades" fill="#2fe0a2" fillOpacity={0.5} radius={[4, 4, 0, 0]} />
              <Line yAxisId="left" type="monotone" dataKey="precio" stroke="#26B7FF" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Pie distribución */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon size={14} className="text-[#26B7FF]" />
            <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider">Composición de Oferta</p>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={distribucionTipos}
                  dataKey="cantidad"
                  nameKey="tipo"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  strokeWidth={0}
                >
                  {distribucionTipos.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#101f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 flex-1">
              {distribucionTipos.map((t, i) => (
                <div key={t.tipo} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-[#c2c6d3] flex-1">{t.tipo}</span>
                  <span className="text-xs font-bold text-[#a7c8ff]">{t.porcentaje}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scatter: Precio vs Crecimiento */}
      <div className="glass rounded-xl p-5">
        <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-1">Precio/m² vs Crecimiento por Distrito</p>
        <p className="text-xs text-[#8c919d] mb-4">Tamaño del círculo = número de propiedades</p>
        <ResponsiveContainer width="100%" height={200}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="x" name="Precio/m²" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Precio/m²', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#8c919d' }} />
            <YAxis dataKey="y" name="Crecimiento %" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: '% Crecimiento', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#8c919d' }} />
            <ZAxis dataKey="z" range={[60, 300]} />
            <Tooltip
              contentStyle={{ background: '#101f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
              formatter={(value, name) => {
                if (name === 'Precio/m²') return [`S/. ${(value as number).toLocaleString()}`, name]
                if (name === 'Crecimiento %') return [`${value}%`, name]
                return [value, name]
              }}
            />
            <Scatter data={scatterData} fill="#26B7FF" fillOpacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
