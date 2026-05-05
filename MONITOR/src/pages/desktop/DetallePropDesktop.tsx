import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Share2, Bed, Bath, Maximize2, TrendingUp, MapPin, Star, Calendar } from 'lucide-react'
import { propiedades, formatSoles, formatM2 } from '../../data/realData'
import { Badge } from '../../components/Badge'
import { StatCard } from '../../components/StatCard'
import { useState } from 'react'

export function DetallePropDesktop() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [favorito, setFavorito] = useState(false)
  const prop = propiedades.find(p => p.id === id) ?? propiedades[0]
  const relacionadas = propiedades.filter(p => p.id !== prop.id && p.distrito === prop.distrito).slice(0, 2)

  return (
    <div className="flex h-full overflow-hidden p-5 gap-5">
      {/* Main */}
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto">
        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[#a7c8ff] hover:text-[#d8e2ff]">
            <ArrowLeft size={16} /> Volver
          </button>
          <div className="flex gap-2">
            <button className="glass px-3 py-2 rounded-lg flex items-center gap-2 text-sm text-[#c2c6d3]">
              <Share2 size={14} /> Compartir
            </button>
            <button
              onClick={() => setFavorito(!favorito)}
              className={`glass px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${favorito ? 'text-[#ffb4ab]' : 'text-[#c2c6d3]'}`}
            >
              <Heart size={14} className={favorito ? 'fill-[#ffb4ab]' : ''} />
              {favorito ? 'Guardado' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="relative rounded-xl overflow-hidden">
          <img src={prop.imagen} alt={prop.titulo} className="w-full h-64 object-cover" />
          <div className="absolute top-3 left-3"><Badge label={prop.estado} /></div>
          <div className="absolute top-3 right-3 glass px-2 py-1 rounded-lg">
            <span className="text-xs font-mono text-[#a7c8ff]">{prop.id}</span>
          </div>
        </div>

        {/* Title & price */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-[#d8e2ff] mb-1">{prop.titulo}</h1>
              <div className="flex items-center gap-1 text-[#8c919d] mb-3">
                <MapPin size={13} /> <span className="text-sm">{prop.distrito}, Lima</span>
              </div>
              <div className="flex items-center gap-6">
                {[
                  { icon: Bed, v: `${prop.dormitorios} dorm.` },
                  { icon: Bath, v: `${prop.banos} baños` },
                  { icon: Maximize2, v: `${prop.area} m²` },
                  { icon: Calendar, v: prop.fechaPublicacion },
                ].map(({ icon: Icon, v }) => (
                  <span key={v} className="flex items-center gap-1.5 text-sm text-[#c2c6d3]">
                    <Icon size={14} className="text-[#26B7FF]" /> {v}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-[#26B7FF]">{formatSoles(prop.precio)}</p>
              <p className="text-sm text-[#8c919d]">{formatM2(prop.precioM2)}</p>
              <div className="flex items-center gap-1 justify-end mt-1 text-[#2fe0a2]">
                <TrendingUp size={13} />
                <span className="text-sm font-semibold">+{prop.variacion}% mensual</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="ROI Estimado" value={`${prop.roi}%`} sub="retorno anual" accent="green" />
          <StatCard label="Precio/m²" value={formatM2(prop.precioM2)} accent="cyan" />
          <StatCard label="Área total" value={`${prop.area} m²`} accent="primary" />
          <StatCard label="Var. mensual" value={`+${prop.variacion}%`} accent="green" />
        </div>

        {/* Desc + amenidades */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-xl p-5">
            <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-3">Descripción</p>
            <p className="text-sm text-[#c2c6d3] leading-relaxed">{prop.descripcion}</p>
          </div>
          <div className="glass rounded-xl p-5">
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

        {/* CTA */}
        <div className="flex gap-3">
          <button className="flex-1 py-3 rounded-xl border border-[rgba(38,183,255,0.3)] text-[#26B7FF] font-semibold">
            Comparar
          </button>
          <button className="flex-1 py-3 rounded-xl bg-[#26B7FF] text-[#03132d] font-bold">
            Solicitar información
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-72 shrink-0 flex flex-col gap-4 overflow-y-auto">
        {/* Rating */}
        <div className="glass rounded-xl p-4 border border-[rgba(47,224,162,0.2)]">
          <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-3">Score de Inversión</p>
          <div className="flex items-center gap-2 mb-2">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={18} className={i <= Math.round(prop.roi / 2) ? 'text-[#2fe0a2] fill-[#2fe0a2]' : 'text-[#424751]'} />
            ))}
            <span className="text-sm font-bold text-[#2fe0a2] ml-1">{prop.roi}/10</span>
          </div>
          <p className="text-xs text-[#8c919d]">Alta rentabilidad potencial para alquiler a corto plazo.</p>
        </div>

        {/* Similares */}
        <div className="glass rounded-xl p-4">
          <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-3">En {prop.distrito}</p>
          {relacionadas.length > 0 ? relacionadas.map(r => (
            <button
              key={r.id}
              onClick={() => navigate(`/propiedad/${r.id}`)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all text-left mb-2 last:mb-0"
            >
              <img src={r.imagen} alt="" className="w-12 h-10 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#d8e2ff] truncate">{r.titulo}</p>
                <p className="text-xs text-[#26B7FF] font-bold">{formatSoles(r.precio)}</p>
              </div>
            </button>
          )) : (
            <p className="text-xs text-[#8c919d]">No hay más propiedades en este distrito.</p>
          )}
        </div>
      </div>
    </div>
  )
}
