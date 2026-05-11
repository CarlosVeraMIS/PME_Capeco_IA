import { useState } from 'react'
import { Heart, Trash2 } from 'lucide-react'
import { PropCard } from '../../components/PropCard'
import { propiedades } from '../../data/capecoData'
import { useNavigate } from 'react-router-dom'

export function Favoritos() {
  const navigate = useNavigate()
  const [favoritos, setFavoritos] = useState(propiedades.slice(0, 3).map(p => p.id))

  const propsFavoritas = propiedades.filter(p => favoritos.includes(p.id))

  const eliminar = (id: string) => setFavoritos(prev => prev.filter(f => f !== id))

  return (
    <div className="pb-24 min-h-screen bg-[#03132d]">
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Heart size={18} className="text-[#ffb4ab]" />
          <h1 className="text-xl font-bold text-[#d8e2ff]">Favoritos</h1>
        </div>
        <p className="text-xs text-[#8c919d] mb-6">{propsFavoritas.length} propiedades guardadas</p>

        {propsFavoritas.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Heart size={40} className="text-[#424751] mx-auto mb-3" />
            <p className="text-[#8c919d]">No tienes propiedades favoritas aún.</p>
            <button
              onClick={() => navigate('/busqueda')}
              className="mt-4 px-4 py-2 rounded-lg bg-[rgba(38,183,255,0.12)] text-[#26B7FF] text-sm font-semibold border border-[rgba(38,183,255,0.3)]"
            >
              Explorar propiedades
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {propsFavoritas.map(prop => (
              <div key={prop.id} className="relative">
                <PropCard
                  prop={prop}
                  onClick={() => navigate(`/propiedad/${prop.id}`)}
                />
                <button
                  onClick={() => eliminar(prop.id)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-[rgba(255,180,171,0.15)] border border-[rgba(255,180,171,0.3)] flex items-center justify-center"
                >
                  <Trash2 size={13} className="text-[#ffb4ab]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
