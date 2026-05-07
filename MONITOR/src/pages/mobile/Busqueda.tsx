import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { PropCard } from '../../components/PropCard'
import { propiedades, distritos } from '../../data/realData'
import { useNavigate } from 'react-router-dom'

const tipos = ['Todos', 'Apartamento', 'Casa', 'Penthouse', 'Loft']

export function Busqueda() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [tipoSeleccionado, setTipoSeleccionado] = useState('Todos')
  const [distritoSeleccionado, setDistritoSeleccionado] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)
  const [precioMax, setPrecioMax] = useState(2000000)

  const filtered = propiedades.filter(p => {
    const matchQuery = p.titulo.toLowerCase().includes(query.toLowerCase()) ||
      p.distrito.toLowerCase().includes(query.toLowerCase())
    const matchTipo = tipoSeleccionado === 'Todos' || p.tipo === tipoSeleccionado
    const matchDistrito = !distritoSeleccionado || p.distrito === distritoSeleccionado
    const matchPrecio = p.precio <= precioMax
    return matchQuery && matchTipo && matchDistrito && matchPrecio
  })

  return (
    <div className="pb-24 min-h-screen bg-[#03132d]">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-[#d8e2ff] mb-4">Búsqueda</h1>

        {/* Search bar */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 glass rounded-lg px-3">
            <Search size={16} className="text-[#8c919d] shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Distrito, tipo de propiedad..."
              className="flex-1 bg-transparent py-3 text-sm text-[#d8e2ff] placeholder:text-[#8c919d] outline-none"
            />
            {query && <button onClick={() => setQuery('')}><X size={14} className="text-[#8c919d]" /></button>}
          </div>
          <button
            onClick={() => setShowFiltros(!showFiltros)}
            className={`glass rounded-lg px-3 flex items-center gap-2 ${showFiltros ? 'border-[rgba(38,183,255,0.4)] text-[#26B7FF]' : 'text-[#c2c6d3]'}`}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {/* Filtros expandibles */}
        {showFiltros && (
          <div className="glass rounded-xl p-4 mb-4 flex flex-col gap-3">
            <div>
              <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-2">Tipo</p>
              <div className="flex flex-wrap gap-2">
                {tipos.map(t => (
                  <button
                    key={t}
                    onClick={() => setTipoSeleccionado(t)}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${
                      tipoSeleccionado === t
                        ? 'bg-[rgba(38,183,255,0.15)] text-[#26B7FF] border-[rgba(38,183,255,0.4)]'
                        : 'text-[#c2c6d3] border-white/10'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-2">Distrito</p>
              <select
                value={distritoSeleccionado}
                onChange={e => setDistritoSeleccionado(e.target.value)}
                className="w-full glass rounded-lg px-3 py-2 text-sm text-[#d8e2ff] bg-transparent outline-none"
              >
                <option value="" className="bg-[#101f3a]">Todos los distritos</option>
                {distritos.map(d => (
                  <option key={d} value={d} className="bg-[#101f3a]">{d}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider">Precio máx.</p>
                <span className="text-xs font-mono text-[#a7c8ff]">S/. {precioMax.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={100000}
                max={2000000}
                step={50000}
                value={precioMax}
                onChange={e => setPrecioMax(Number(e.target.value))}
                className="w-full accent-[#26B7FF]"
              />
            </div>
          </div>
        )}

        {/* Tipo chips (quick filter) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tipos.map(t => (
            <button
              key={t}
              onClick={() => setTipoSeleccionado(t)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${
                tipoSeleccionado === t
                  ? 'bg-[rgba(38,183,255,0.15)] text-[#26B7FF] border-[rgba(38,183,255,0.4)]'
                  : 'text-[#c2c6d3] border-white/10'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-4">
        <p className="text-xs text-[#8c919d] mb-3">{filtered.length} propiedades encontradas</p>
        <div className="flex flex-col gap-3">
          {filtered.map(prop => (
            <PropCard
              key={prop.id}
              prop={prop}
              onClick={() => navigate(`/propiedad/${prop.id}`)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-[#8c919d]">No se encontraron propiedades con esos filtros.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
