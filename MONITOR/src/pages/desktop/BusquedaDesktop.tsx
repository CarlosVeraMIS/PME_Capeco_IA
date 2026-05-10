import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { PropCard } from '../../components/PropCard'
import { propiedades, distritos, formatSoles } from '../../data/capecoData'
import { useNavigate } from 'react-router-dom'
import { capecoApi } from '../../services/capecoApi'

const tipos = ['Todos', 'Apartamento', 'Casa', 'Penthouse', 'Loft']
const ordenOpciones = ['Precio ↑', 'Precio ↓', 'Área ↑', 'ROI ↓', 'Recientes']

export function BusquedaDesktop() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [tipo, setTipo] = useState('Todos')
  const [distrito, setDistrito] = useState('')
  const [precioMax, setPrecioMax] = useState(2000000)
  const [orden, setOrden] = useState('Recientes')
  const [allProperties, setAllProperties] = useState(propiedades)

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const data = await capecoApi.fetchProjects()
        setAllProperties(data || propiedades)
      } catch (error) {
        console.error('Error loading properties:', error)
      }
    }
    loadProperties()
  }, [])

 const filtered = allProperties
  .filter(p => {
    const titulo = p.titulo?.toLowerCase() ?? ''
    const dist = p.distrito?.toLowerCase() ?? ''
    const mQ = titulo.includes(query.toLowerCase()) || dist.includes(query.toLowerCase())
    const mT = tipo === 'Todos' || p.tipo === tipo
    const mD = !distrito || p.distrito === distrito
    const mP = (p.precio ?? 0) <= precioMax
    return mQ && mT && mD && mP
  })
  .sort((a, b) => {
    if (orden === 'Precio ↑') return (a.precio ?? 0) - (b.precio ?? 0)
    if (orden === 'Precio ↓') return (b.precio ?? 0) - (a.precio ?? 0)
    if (orden === 'Área ↑') return (b.area ?? 0) - (a.area ?? 0)
    if (orden === 'ROI ↓') return (b.roi ?? 0) - (a.roi ?? 0)
    return 0
  })    <div className="flex h-full overflow-hidden">
      {/* Sidebar filtros */}
      <aside className="w-64 shrink-0 border-r border-white/10 flex flex-col overflow-y-auto p-4 gap-4">
        <div>
          <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-2 flex items-center gap-2">
            <SlidersHorizontal size={12} /> Filtros
          </p>
        </div>

        {/* Tipo */}
        <div>
          <p className="text-xs text-[#8c919d] mb-2">Tipo de propiedad</p>
          <div className="flex flex-col gap-1">
            {tipos.map(t => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`text-left text-sm px-3 py-2 rounded-lg transition-all ${
                  tipo === t
                    ? 'bg-[rgba(38,183,255,0.12)] text-[#26B7FF] border border-[rgba(38,183,255,0.25)]'
                    : 'text-[#c2c6d3] hover:bg-white/5'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Distrito */}
        <div>
          <p className="text-xs text-[#8c919d] mb-2">Distrito</p>
          <select
            value={distrito}
            onChange={e => setDistrito(e.target.value)}
            className="w-full glass rounded-lg px-3 py-2 text-sm text-[#d8e2ff] bg-transparent outline-none"
          >
            <option value="" className="bg-[#101f3a]">Todos</option>
            {distritos.map(d => <option key={d} value={d} className="bg-[#101f3a]">{d}</option>)}
          </select>
        </div>

        {/* Precio */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[#8c919d]">Precio máximo</p>
            <span className="text-xs font-mono text-[#a7c8ff]">{formatSoles(precioMax)}</span>
          </div>
          <input
            type="range" min={100000} max={2000000} step={50000}
            value={precioMax}
            onChange={e => setPrecioMax(Number(e.target.value))}
            className="w-full accent-[#26B7FF]"
          />
        </div>

        <button
          onClick={() => { setTipo('Todos'); setDistrito(''); setPrecioMax(2000000); setQuery('') }}
          className="text-xs text-[#8c919d] hover:text-[#c2c6d3] underline mt-auto"
        >
          Limpiar filtros
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden p-5">
        {/* Search + order */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2 glass rounded-lg px-4">
            <Search size={16} className="text-[#8c919d]" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nombre, distrito..."
              className="flex-1 bg-transparent py-3 text-sm text-[#d8e2ff] placeholder:text-[#8c919d] outline-none"
            />
          </div>
          <select
            value={orden}
            onChange={e => setOrden(e.target.value)}
            className="glass rounded-lg px-3 py-2.5 text-sm text-[#d8e2ff] bg-transparent outline-none"
          >
            {ordenOpciones.map(o => <option key={o} value={o} className="bg-[#101f3a]">{o}</option>)}
          </select>
          <span className="text-xs text-[#8c919d] shrink-0">{filtered.length} resultados</span>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-4">
            {filtered.map(prop => (
              <PropCard
                key={prop.id}
                prop={prop}
                onClick={() => navigate(`/propiedad/${prop.id}`)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 glass rounded-xl p-12 text-center">
                <p className="text-[#8c919d]">No se encontraron propiedades con esos filtros.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
