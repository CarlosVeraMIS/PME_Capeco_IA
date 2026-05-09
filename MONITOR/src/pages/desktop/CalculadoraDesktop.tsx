import { useState } from 'react'
import { Calculator, TrendingUp } from 'lucide-react'
import { formatSoles } from '../../data/capecoData'

function Slider({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number
  format: (v: number) => string; onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-[#c2c6d3]">{label}</span>
        <span className="text-sm font-bold text-[#26B7FF] font-mono">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[#26B7FF] h-1.5 rounded-full cursor-pointer"
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[#424751]">{format(min)}</span>
        <span className="text-[10px] text-[#424751]">{format(max)}</span>
      </div>
    </div>
  )
}

export function CalculadoraDesktop() {
  const [precio, setPrecio] = useState(350000)
  const [inicial, setInicial] = useState(20)
  const [plazo, setPlazo] = useState(20)
  const [tasa, setTasa] = useState(8.5)

  const prestamo = precio * (1 - inicial / 100)
  const tasaMensual = tasa / 100 / 12
  const meses = plazo * 12
  const cuota = prestamo * (tasaMensual * Math.pow(1 + tasaMensual, meses)) / (Math.pow(1 + tasaMensual, meses) - 1)
  const totalPagado = cuota * meses
  const totalIntereses = totalPagado - prestamo
  const roi = ((precio * 0.06 * 12) / (precio * inicial / 100)) * 100

  return (
    <div className="p-6 overflow-y-auto h-full flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-[#d8e2ff]">Calculadora Hipotecaria</h1>
        <p className="text-sm text-[#8c919d]">Simula tu financiamiento en soles</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="glass rounded-xl p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2 mb-1">
            <Calculator size={16} className="text-[#26B7FF]" />
            <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider">Parámetros</p>
          </div>
          <Slider label="Precio del inmueble" value={precio} min={100000} max={2000000} step={10000}
            format={v => formatSoles(v)} onChange={setPrecio} />
          <Slider label="Cuota inicial" value={inicial} min={10} max={50} step={5}
            format={v => `${v}%`} onChange={setInicial} />
          <Slider label="Plazo" value={plazo} min={5} max={30} step={1}
            format={v => `${v} años`} onChange={setPlazo} />
          <Slider label="Tasa de interés anual" value={tasa} min={5} max={20} step={0.5}
            format={v => `${v}%`} onChange={setTasa} />
        </div>

        {/* Results */}
        <div className="flex flex-col gap-4">
          <div className="glass rounded-xl p-6 border border-[rgba(38,183,255,0.2)]">
            <p className="text-xs text-[#8c919d] mb-1">Cuota mensual estimada</p>
            <p className="text-4xl font-bold text-[#26B7FF] font-mono">{formatSoles(cuota)}</p>
            <p className="text-xs text-[#8c919d] mt-1">por {plazo * 12} meses</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Préstamo', value: formatSoles(prestamo), color: 'text-[#d8e2ff]' },
              { label: 'Cuota inicial', value: formatSoles(precio * inicial / 100), color: 'text-[#d8e2ff]' },
              { label: 'Total a pagar', value: formatSoles(totalPagado), color: 'text-[#a7c8ff]' },
              { label: 'Total intereses', value: formatSoles(totalIntereses), color: 'text-[#ffb4ab]' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass rounded-xl p-4">
                <p className="text-xs text-[#8c919d] mb-1">{label}</p>
                <p className={`text-base font-bold font-mono ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="glass rounded-xl p-5 border border-[rgba(47,224,162,0.2)]">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-[#2fe0a2]" />
              <p className="text-xs font-semibold text-[#2fe0a2] uppercase tracking-wider">ROI estimado alquiler</p>
            </div>
            <p className="text-3xl font-bold text-[#2fe0a2] font-mono">{roi.toFixed(1)}%</p>
            <p className="text-xs text-[#8c919d] mt-1">retorno sobre inversión inicial</p>
          </div>
        </div>
      </div>
    </div>
  )
}
