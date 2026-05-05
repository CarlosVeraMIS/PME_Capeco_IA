import { useState } from 'react'
import { Bell, TrendingUp, MapPin, Tag, X, CheckCheck } from 'lucide-react'
import { alertas as initialAlertas } from '../../data/realData'

const iconMap = { precio: TrendingUp, zona: MapPin, oferta: Tag, mercado: Bell }
const borderMap = { alta: 'border-[#ffb4ab]', media: 'border-[#26B7FF]', baja: 'border-[rgba(255,255,255,0.1)]' }
const prioridadLabel = { alta: 'Alta', media: 'Media', baja: 'Baja' }
const prioridadColor = { alta: 'text-[#ffb4ab]', media: 'text-[#26B7FF]', baja: 'text-[#8c919d]' }

export function AlertasDesktop() {
  const [alertas, setAlertas] = useState(initialAlertas)

  const marcarTodas = () => setAlertas(a => a.map(x => ({ ...x, leida: true })))
  const descartar = (id: string) => setAlertas(a => a.filter(x => x.id !== id))

  const noLeidas = alertas.filter(a => !a.leida).length

  return (
    <div className="p-6 overflow-y-auto h-full flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#d8e2ff]">Alertas</h1>
          <p className="text-sm text-[#8c919d]">{noLeidas} sin leer</p>
        </div>
        {noLeidas > 0 && (
          <button
            onClick={marcarTodas}
            className="flex items-center gap-2 glass px-4 py-2 rounded-lg text-sm text-[#26B7FF] border border-[rgba(38,183,255,0.3)]"
          >
            <CheckCheck size={14} /> Marcar todas leídas
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 max-w-2xl">
        {alertas.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Bell size={32} className="text-[#424751] mx-auto mb-3" />
            <p className="text-[#8c919d]">No tienes alertas</p>
          </div>
        ) : alertas.map(a => {
          const Icon = iconMap[a.tipo as keyof typeof iconMap] ?? Bell
          const border = borderMap[a.prioridad as keyof typeof borderMap] ?? borderMap.baja
          return (
            <div
              key={a.id}
              className={`glass rounded-xl p-5 flex items-start gap-4 border-l-2 transition-all ${border} ${a.leida ? 'opacity-60' : ''}`}
            >
              <div className="w-9 h-9 rounded-full bg-[rgba(38,183,255,0.1)] flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={16} className="text-[#26B7FF]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-[#d8e2ff]">{a.titulo}</p>
                  {!a.leida && <span className="w-2 h-2 rounded-full bg-[#26B7FF] shrink-0" />}
                </div>
                <p className="text-xs text-[#8c919d] mb-2">{a.mensaje}</p>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${prioridadColor[a.prioridad as keyof typeof prioridadColor]}`}>
                    {prioridadLabel[a.prioridad as keyof typeof prioridadLabel]}
                  </span>
                  <span className="text-[10px] text-[#424751]">{a.tiempo}</span>
                </div>
              </div>
              <button
                onClick={() => descartar(a.id)}
                className="text-[#424751] hover:text-[#8c919d] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
