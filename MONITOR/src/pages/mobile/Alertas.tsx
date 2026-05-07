import { useState } from 'react'
import { Bell, TrendingUp, Home, Heart, X } from 'lucide-react'
import { alertas } from '../../data/realData'

const iconoPorTipo: Record<string, React.ElementType> = {
  precio: TrendingUp,
  nueva: Home,
  favorito: Heart,
  mercado: TrendingUp,
}

const colorPorPrioridad: Record<string, string> = {
  alta: 'text-[#ffb4ab]',
  media: 'text-[#26B7FF]',
  baja: 'text-[#8c919d]',
}

const bgPorPrioridad: Record<string, string> = {
  alta: 'bg-[rgba(255,180,171,0.1)] border-[rgba(255,180,171,0.2)]',
  media: 'bg-[rgba(38,183,255,0.08)] border-[rgba(38,183,255,0.15)]',
  baja: 'bg-transparent border-white/10',
}

export function Alertas() {
  const [items, setItems] = useState(alertas)
  const noLeidas = items.filter(a => !a.leida).length

  const marcarLeida = (id: string) => {
    setItems(prev => prev.map(a => a.id === id ? { ...a, leida: true } : a))
  }

  const eliminar = (id: string) => {
    setItems(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="pb-24 min-h-screen bg-[#03132d]">
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#d8e2ff]">Alertas</h1>
            {noLeidas > 0 && (
              <p className="text-xs text-[#26B7FF]">{noLeidas} sin leer</p>
            )}
          </div>
          <button
            onClick={() => setItems(prev => prev.map(a => ({ ...a, leida: true })))}
            className="text-xs text-[#a7c8ff] glass rounded-lg px-3 py-1.5"
          >
            Marcar todas
          </button>
        </div>

        {/* Nueva alerta config */}
        <div className="glass rounded-xl p-4 mb-4 border border-[rgba(38,183,255,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[rgba(38,183,255,0.1)] flex items-center justify-center shrink-0">
              <Bell size={16} className="text-[#26B7FF]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#d8e2ff]">Nueva alerta de precio</p>
              <p className="text-xs text-[#8c919d]">Monitorea cambios en tu zona</p>
            </div>
            <button className="text-xs px-3 py-1.5 rounded-full bg-[#26B7FF] text-[#03132d] font-semibold">
              + Crear
            </button>
          </div>
        </div>

        {/* Lista de alertas */}
        <div className="flex flex-col gap-2">
          {items.map(alerta => {
            const Icon = iconoPorTipo[alerta.tipo] ?? Bell
            return (
              <div
                key={alerta.id}
                onClick={() => marcarLeida(alerta.id)}
                className={`glass rounded-xl p-3 border cursor-pointer transition-all ${bgPorPrioridad[alerta.prioridad]} ${!alerta.leida ? 'opacity-100' : 'opacity-60'}`}
              >
                <div className="flex gap-3 items-start">
                  <div className={`w-8 h-8 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center shrink-0 ${colorPorPrioridad[alerta.prioridad]}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[#d8e2ff] leading-snug">{alerta.titulo}</p>
                      <button
                        onClick={e => { e.stopPropagation(); eliminar(alerta.id) }}
                        className="shrink-0 text-[#424751] hover:text-[#8c919d]"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-[#c2c6d3] mt-0.5 leading-relaxed">{alerta.mensaje}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-[#8c919d]">Hace {alerta.tiempo}</span>
                      {!alerta.leida && (
                        <span className="w-2 h-2 rounded-full bg-[#26B7FF]" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {items.length === 0 && (
            <div className="glass rounded-xl p-8 text-center">
              <Bell size={32} className="text-[#424751] mx-auto mb-2" />
              <p className="text-[#8c919d] text-sm">Sin alertas pendientes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
