import { Bed, Bath, Maximize2, TrendingUp } from 'lucide-react'
import { Badge } from './Badge'
import { formatSoles } from '../data/capecoData'
import type { propiedades } from '../data/capecoData'
import type { CapecoProject } from '../services/capecoApi'

type Propiedad = (typeof propiedades)[number]
type Propiedad_Union = Propiedad | CapecoProject

interface PropCardProps {
  prop: Propiedad_Union
  onClick?: () => void
  compact?: boolean
}

export function PropCard({ prop, onClick, compact }: PropCardProps) {
  return (
    <div
      className="glass glass-hover rounded-lg overflow-hidden cursor-pointer transition-all"
      onClick={onClick}
    >
      <div className="relative">
        <img
          src={prop.imagen}
          alt={prop.titulo}
          className={`w-full object-cover ${compact ? 'h-32' : 'h-44'}`}
          loading="lazy"
        />
        <div className="absolute top-2 left-2">
          <Badge label={prop.estado} />
        </div>
        <div className="absolute top-2 right-2 glass rounded px-2 py-0.5">
          <span className="text-[10px] font-mono text-[#a7c8ff]">{prop.id}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#03132d] to-transparent" />
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-[#d8e2ff] mb-1 line-clamp-1">{prop.titulo}</p>
        <p className="text-xs text-[#8c919d] mb-2">{prop.distrito}</p>
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-base font-bold text-[#26B7FF]">{formatSoles(prop.precio)}</p>
            <p className="text-[10px] text-[#8c919d]">{formatSoles(prop.precioM2)}/m²</p>
          </div>
          <div className="flex items-center gap-1 text-[#2fe0a2]">
            <TrendingUp size={12} />
            <span className="text-xs font-semibold">+{prop.variacion}%</span>
          </div>
        </div>
        {!compact && (
          <div className="flex items-center gap-3 text-[#c2c6d3]">
            <span className="flex items-center gap-1 text-xs">
              <Bed size={12} /> {prop.dormitorios}
            </span>
            <span className="flex items-center gap-1 text-xs">
              <Bath size={12} /> {prop.banos}
            </span>
            <span className="flex items-center gap-1 text-xs">
              <Maximize2 size={12} /> {prop.area}m²
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
