import { useState } from 'react'
import { Plus, X, Check } from 'lucide-react'
import { propiedades, formatSoles } from '../../data/realData'
import { useNavigate } from 'react-router-dom'

const campos = [
  { key: 'precio', label: 'Precio', format: (v: number) => formatSoles(v) },
  { key: 'precioM2', label: 'Precio/m²', format: (v: number) => `${formatSoles(v)}/m²` },
  { key: 'area', label: 'Área', format: (v: number) => `${v} m²` },
  { key: 'dormitorios', label: 'Dormitorios', format: (v: number) => `${v} dorm.` },
  { key: 'banos', label: 'Baños', format: (v: number) => `${v} baños` },
  { key: 'roi', label: 'ROI est.', format: (v: number) => `${v}%` },
]

export function Comparador() {
  const navigate = useNavigate()
  const [seleccionados, setSeleccionados] = useState<string[]>([propiedades[0].id, propiedades[1].id])
  const [showSelector, setShowSelector] = useState(false)

  const propsComparadas = seleccionados.map(id => propiedades.find(p => p.id === id)!)

  const quitar = (id: string) => setSeleccionados(prev => prev.filter(s => s !== id))
  const agregar = (id: string) => {
    if (seleccionados.length < 3 && !seleccionados.includes(id)) {
      setSeleccionados(prev => [...prev, id])
    }
    setShowSelector(false)
  }

  const getBest = (key: string): string => {
    const vals = propsComparadas.map(p => (p as Record<string, unknown>)[key] as number)
    const best = key === 'precio' || key === 'precioM2' ? Math.min(...vals) : Math.max(...vals)
    const bestId = propsComparadas.find(p => (p as Record<string, unknown>)[key] === best)?.id
    return bestId ?? ''
  }

  return (
    <div className="pb-24 min-h-screen bg-[#03132d]">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-[#d8e2ff] mb-1">Comparador</h1>
        <p className="text-xs text-[#8c919d] mb-4">Compara hasta 3 propiedades</p>

        {/* Header propiedades */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max mb-4">
            {propsComparadas.map(prop => (
              <div key={prop.id} className="w-36 glass rounded-xl overflow-hidden shrink-0">
                <div className="relative">
                  <img src={prop.imagen} alt="" className="w-full h-20 object-cover" />
                  <button
                    onClick={() => quitar(prop.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full glass flex items-center justify-center"
                  >
                    <X size={10} className="text-[#d8e2ff]" />
                  </button>
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-semibold text-[#d8e2ff] line-clamp-2">{prop.titulo}</p>
                  <p className="text-[9px] text-[#8c919d]">{prop.distrito}</p>
                </div>
              </div>
            ))}
            {seleccionados.length < 3 && (
              <button
                onClick={() => setShowSelector(true)}
                className="w-36 h-36 glass rounded-xl flex flex-col items-center justify-center gap-2 shrink-0 border border-dashed border-white/20"
              >
                <Plus size={20} className="text-[#8c919d]" />
                <span className="text-xs text-[#8c919d]">Añadir</span>
              </button>
            )}
          </div>
        </div>

        {/* Comparación */}
        <div className="flex flex-col gap-2">
          {campos.map(({ key, label, format }) => {
            const bestId = getBest(key)
            return (
              <div key={key} className="glass rounded-xl p-3">
                <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-2">{label}</p>
                <div className="flex gap-2">
                  {propsComparadas.map(prop => {
                    const val = (prop as Record<string, unknown>)[key] as number
                    const isBest = prop.id === bestId
                    return (
                      <div
                        key={prop.id}
                        className={`flex-1 py-2 px-2 rounded-lg text-center ${
                          isBest ? 'bg-[rgba(47,224,162,0.1)] border border-[rgba(47,224,162,0.25)]' : 'bg-[rgba(255,255,255,0.04)]'
                        }`}
                      >
                        <p className={`text-xs font-bold ${isBest ? 'text-[#2fe0a2]' : 'text-[#d8e2ff]'}`}>
                          {format(val)}
                        </p>
                        {isBest && <Check size={10} className="text-[#2fe0a2] mx-auto mt-0.5" />}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Selector modal */}
        {showSelector && (
          <div className="fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSelector(false)} />
            <div className="relative w-full glass rounded-t-2xl p-4 max-h-96 overflow-y-auto">
              <p className="text-sm font-semibold text-[#d8e2ff] mb-3">Seleccionar propiedad</p>
              {propiedades.filter(p => !seleccionados.includes(p.id)).map(prop => (
                <button
                  key={prop.id}
                  onClick={() => agregar(prop.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-all text-left"
                >
                  <img src={prop.imagen} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <p className="text-sm text-[#d8e2ff] font-medium">{prop.titulo}</p>
                    <p className="text-xs text-[#8c919d]">{prop.distrito} — {formatSoles(prop.precio)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => navigate('/busqueda')}
          className="w-full mt-4 py-3 rounded-xl glass border border-[rgba(38,183,255,0.3)] text-[#26B7FF] text-sm font-semibold"
        >
          Explorar más propiedades
        </button>
      </div>
    </div>
  )
}
