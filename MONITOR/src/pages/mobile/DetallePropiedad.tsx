import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Share2, Bed, Bath, Maximize2, TrendingUp, MapPin, Star } from 'lucide-react'
import { propiedades, formatSoles } from '../../data/realData'
import { Badge } from '../../components/Badge'
import { useState } from 'react'

export function DetallePropiedad() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [favorito, setFavorito] = useState(false)
  const prop = propiedades.find(p => p.id === id) ?? propiedades[0]

  return (
    <div className="pb-32 min-h-screen bg-[#03132d]">
      {/* Image + header */}
      <div className="relative">
        <img src={prop.imagen} alt={prop.titulo} className="w-full h-64 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#03132d]" />
        <div className="absolute top-12 left-4 right-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="glass w-9 h-9 rounded-full flex items-center justify-center">
            <ArrowLeft size={18} className="text-[#d8e2ff]" />
          </button>
          <div className="flex gap-2">
            <button className="glass w-9 h-9 rounded-full flex items-center justify-center">
              <Share2 size={16} className="text-[#d8e2ff]" />
            </button>
            <button
              onClick={() => setFavorito(!favorito)}
              className="glass w-9 h-9 rounded-full flex items-center justify-center"
            >
              <Heart size={16} className={favorito ? 'text-[#ffb4ab] fill-[#ffb4ab]' : 'text-[#d8e2ff]'} />
            </button>
          </div>
        </div>
        <div className="absolute bottom-4 left-4">
          <Badge label={prop.estado} />
        </div>
      </div>

      <div className="px-4 -mt-2">
        {/* Title & price */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-[#8c919d]">{prop.id}</span>
            <span className="text-[10px] text-[#8c919d]">• {prop.tipo}</span>
          </div>
          <h1 className="text-xl font-bold text-[#d8e2ff] mb-1">{prop.titulo}</h1>
          <div className="flex items-center gap-1 text-[#8c919d] mb-3">
            <MapPin size={12} />
            <span className="text-xs">{prop.distrito}, Lima</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-[#26B7FF]">{formatSoles(prop.precio)}</p>
              <p className="text-xs text-[#8c919d]">{formatSoles(prop.precioM2)}/m²</p>
            </div>
            <div className="flex items-center gap-1 text-[#2fe0a2]">
              <TrendingUp size={14} />
              <span className="text-sm font-bold">+{prop.variacion}% mensual</span>
            </div>
          </div>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { icon: Bed, label: 'Dormitorios', value: prop.dormitorios },
            { icon: Bath, label: 'Baños', value: prop.banos },
            { icon: Maximize2, label: 'Área', value: `${prop.area}m²` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="glass rounded-lg p-3 text-center">
              <Icon size={18} className="text-[#26B7FF] mx-auto mb-1" />
              <p className="text-sm font-bold text-[#d8e2ff]">{value}</p>
              <p className="text-[10px] text-[#8c919d]">{label}</p>
            </div>
          ))}
        </div>

        {/* ROI */}
        <div className="glass rounded-xl p-4 mb-4 border border-[rgba(47,224,162,0.2)]">
          <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-2">Potencial de Inversión</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-[#2fe0a2]">{prop.roi}%</p>
              <p className="text-xs text-[#8c919d]">ROI estimado anual</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 mb-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={12} className={i <= Math.round(prop.roi / 2) ? 'text-[#2fe0a2] fill-[#2fe0a2]' : 'text-[#424751]'} />
                ))}
              </div>
              <p className="text-xs text-[#8c919d]">Publicado {prop.fechaPublicacion}</p>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div className="glass rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-2">Descripción</p>
          <p className="text-sm text-[#c2c6d3] leading-relaxed">{prop.descripcion}</p>
        </div>

        {/* Amenidades */}
        <div className="glass rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-3">Amenidades</p>
          <div className="flex flex-wrap gap-2">
            {prop.amenidades.map(a => (
              <span key={a} className="text-xs px-3 py-1.5 rounded-full bg-[rgba(38,183,255,0.08)] text-[#a7c8ff] border border-[rgba(38,183,255,0.2)]">
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CTA footer */}
      <div className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 p-4 pb-safe flex gap-3">
        <button className="flex-1 py-3 rounded-lg border border-[rgba(38,183,255,0.3)] text-[#26B7FF] text-sm font-semibold">
          Comparar
        </button>
        <button className="flex-1 py-3 rounded-lg bg-[#26B7FF] text-[#03132d] text-sm font-bold">
          Consultar
        </button>
      </div>
    </div>
  )
}
