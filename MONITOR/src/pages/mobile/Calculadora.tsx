import { useState } from 'react'
import { Calculator, TrendingUp, DollarSign } from 'lucide-react'
import { formatSoles } from '../../data/realData'

export function Calculadora() {
  const [precioPropiedad, setPrecioPropiedad] = useState(500000)
  const [inicial, setInicial] = useState(20)
  const [plazo, setPlazo] = useState(20)
  const [tasa, setTasa] = useState(8.5)

  const montoInicial = (precioPropiedad * inicial) / 100
  const prestamo = precioPropiedad - montoInicial
  const tasaMensual = tasa / 100 / 12
  const cuotas = plazo * 12
  const cuotaMensual = cuotas > 0 && tasaMensual > 0
    ? (prestamo * tasaMensual * Math.pow(1 + tasaMensual, cuotas)) / (Math.pow(1 + tasaMensual, cuotas) - 1)
    : 0
  const totalPagado = cuotaMensual * cuotas
  const totalIntereses = totalPagado - prestamo
  const roiEstimado = ((precioPropiedad * 0.07) / montoInicial) * 100

  return (
    <div className="pb-24 min-h-screen bg-[#03132d]">
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-2 mb-6">
          <Calculator size={20} className="text-[#26B7FF]" />
          <h1 className="text-xl font-bold text-[#d8e2ff]">Calculadora</h1>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Precio */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider">Precio de la propiedad</p>
              <span className="text-sm font-bold font-mono text-[#a7c8ff]">{formatSoles(precioPropiedad)}</span>
            </div>
            <input
              type="range" min={100000} max={2000000} step={25000}
              value={precioPropiedad}
              onChange={e => setPrecioPropiedad(Number(e.target.value))}
              className="w-full accent-[#26B7FF]"
            />
            <div className="flex justify-between text-[10px] text-[#8c919d] mt-1">
              <span>S/. 100k</span><span>S/. 2M</span>
            </div>
          </div>

          {/* Inicial */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider">Cuota inicial</p>
              <span className="text-sm font-bold font-mono text-[#a7c8ff]">{inicial}% — {formatSoles(montoInicial)}</span>
            </div>
            <input
              type="range" min={10} max={50} step={5}
              value={inicial}
              onChange={e => setInicial(Number(e.target.value))}
              className="w-full accent-[#26B7FF]"
            />
            <div className="flex justify-between text-[10px] text-[#8c919d] mt-1">
              <span>10%</span><span>50%</span>
            </div>
          </div>

          {/* Plazo */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider">Plazo</p>
              <span className="text-sm font-bold font-mono text-[#a7c8ff]">{plazo} años</span>
            </div>
            <input
              type="range" min={5} max={30} step={5}
              value={plazo}
              onChange={e => setPlazo(Number(e.target.value))}
              className="w-full accent-[#26B7FF]"
            />
            <div className="flex justify-between text-[10px] text-[#8c919d] mt-1">
              <span>5 años</span><span>30 años</span>
            </div>
          </div>

          {/* Tasa */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider">Tasa de interés anual</p>
              <span className="text-sm font-bold font-mono text-[#a7c8ff]">{tasa}%</span>
            </div>
            <input
              type="range" min={5} max={15} step={0.5}
              value={tasa}
              onChange={e => setTasa(Number(e.target.value))}
              className="w-full accent-[#26B7FF]"
            />
            <div className="flex justify-between text-[10px] text-[#8c919d] mt-1">
              <span>5%</span><span>15%</span>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="glass rounded-xl p-4 mb-4 border border-[rgba(38,183,255,0.2)]">
          <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-4">Resumen del Crédito</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#8c919d] mb-1">Cuota mensual</p>
              <p className="text-xl font-bold text-[#26B7FF]">{formatSoles(Math.round(cuotaMensual))}</p>
            </div>
            <div>
              <p className="text-xs text-[#8c919d] mb-1">Monto préstamo</p>
              <p className="text-base font-bold text-[#a7c8ff]">{formatSoles(prestamo)}</p>
            </div>
            <div>
              <p className="text-xs text-[#8c919d] mb-1">Total a pagar</p>
              <p className="text-base font-bold text-[#d8e2ff]">{formatSoles(Math.round(totalPagado))}</p>
            </div>
            <div>
              <p className="text-xs text-[#8c919d] mb-1">Total intereses</p>
              <p className="text-base font-bold text-[#ffb4ab]">{formatSoles(Math.round(totalIntereses))}</p>
            </div>
          </div>
        </div>

        {/* ROI card */}
        <div className="glass rounded-xl p-4 border border-[rgba(47,224,162,0.2)]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-[#2fe0a2]" />
            <p className="text-xs font-semibold text-[#2fe0a2] uppercase tracking-wider">ROI Estimado</p>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-[#2fe0a2]">{roiEstimado.toFixed(1)}%</p>
              <p className="text-xs text-[#8c919d]">Retorno sobre capital inicial</p>
            </div>
            <div className="text-right">
              <DollarSign size={24} className="text-[rgba(47,224,162,0.3)] ml-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
