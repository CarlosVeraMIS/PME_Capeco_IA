import { useState } from 'react'
import { Heart, Trash2 } from 'lucide-react'
import { propiedades } from '../../data/realData'
import { PropCard } from '../../components/PropCard'
import { useNavigate } from 'react-router-dom'

export function FavoritosDesktop() {
  const navigate = useNavigate()
  const [favoritos, setFavoritos] = useState(propiedades.slice(0, 3).map(p => p.id))

  const propsFav = propiedades.filter(p => favoritos.includes(p.id))
  const quitar = (id: string) => setFavoritos(f => f.filter(x => x !== id))

  return (
    <div className="p-6 overflow-y-auto h-full flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#d8e2ff]">Favoritos</h1>
          <p className="text-sm text-[#8c919d]">{propsFav.length} propiedades guardadas</p>
        </div>
      </div>

      {propsFav.length === 0 ? (
        <div className="glass rounded-xl p-16 text-center">
          <Heart size={40} className="text-[#424751] mx-auto mb-4" />
          <p className="text-[#8c919d] mb-4">No tienes propiedades guardadas</p>
          <button
            onClick={() => navigate('/busqueda')}
            className="px-6 py-2.5 rounded-xl bg-[#26B7FF] text-[#03132d] font-bold text-sm"
          >
            Explorar propiedades
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {propsFav.map(prop => (
            <div key={prop.id} className="relative group">
              <PropCard prop={prop} onClick={() => navigate(`/propiedad/${prop.id}`)} />
              <button
                onClick={() => quitar(prop.id)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all glass w-8 h-8 rounded-full flex items-center justify-center text-[#ffb4ab] hover:bg-[rgba(255,180,171,0.15)]"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
