import { useState, useRef, useEffect } from 'react'
import { Send, Download, Bot, User, Filter, Share2, Compass, Sparkles } from 'lucide-react'
import { propiedades, formatSoles } from '../../data/realData'

type Mensaje = {
  id: string
  rol: 'ia' | 'user'
  texto: string
  tabla?: typeof propiedades
}

const respuestasIA: { match: RegExp; respuesta: string; filtro?: (p: typeof propiedades[0]) => boolean; sort?: (a: typeof propiedades[0], b: typeof propiedades[0]) => number }[] = [
  { match: /barato|econom|mínimo|menor precio/i, respuesta: 'Propiedades con menor precio en Lima:', filtro: p => p.precio < 700000 },
  { match: /miraflores/i, respuesta: 'Propiedades en Miraflores:', filtro: p => p.distrito === 'Miraflores' },
  { match: /san isidro/i, respuesta: 'Propiedades en San Isidro:', filtro: p => p.distrito === 'San Isidro' },
  { match: /surco/i, respuesta: 'Propiedades en Santiago de Surco:', filtro: p => p.distrito === 'Surco' },
  { match: /roi|rentab|invers/i, respuesta: 'Propiedades ordenadas por mayor ROI estimado:', sort: (a, b) => b.roi - a.roi },
  { match: /disponible/i, respuesta: 'Propiedades actualmente disponibles:', filtro: p => p.estado === 'Disponible' },
  { match: /casa/i, respuesta: 'Casas en el inventario:', filtro: p => p.tipo === 'Casa' },
  { match: /departamento|apto|flat/i, respuesta: 'Departamentos y flats:', filtro: p => p.tipo === 'Apartamento' },
  { match: /resumen|estadística|total|cuantos|cuántos/i, respuesta: 'Resumen del inventario actual:\n• 312 proyectos cargados\n• 8 distritos activos\n• Precio/m² promedio: S/ 6,485\n• ROI promedio: 6.2%\n• Variación mensual: +4.8%' },
]

function obtenerRespuesta(pregunta: string): Mensaje {
  for (const r of respuestasIA) {
    if (r.match.test(pregunta)) {
      let tabla = r.filtro ? propiedades.filter(r.filtro) : propiedades
      if (r.sort) tabla = [...tabla].sort(r.sort)
      return { id: Date.now().toString(), rol: 'ia', texto: r.respuesta, tabla: tabla.length > 0 ? tabla : undefined }
    }
  }
  return { id: Date.now().toString(), rol: 'ia', texto: `Resultados para "${pregunta}":`, tabla: propiedades }
}

function exportarCSV(tabla: typeof propiedades) {
  const headers = ['ID', 'Título', 'Distrito', 'Precio', 'Precio/m²', 'Área', 'Dorm.', 'Estado', 'ROI%', 'Var%']
  const rows = tabla.map(p => [p.id, p.titulo, p.distrito, p.precio, p.precioM2, p.area, p.dormitorios, p.estado, p.roi, p.variacion])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'monitor_ia.csv'; a.click()
  URL.revokeObjectURL(url)
}

const mensajeInicial: Mensaje = {
  id: '0', rol: 'ia',
  texto: '¡Hola! Tengo cargados los 312 proyectos cruzados. Pídeme resúmenes estadísticos o filtros que no estén en tu Dashboard.',
  tabla: propiedades,
}

const sugerencias = [
  'Propiedades con mejor ROI',
  'Resumen estadístico',
  'Propiedades disponibles',
  'Las más baratas en Lima',
  'Departamentos en Miraflores',
]

export function MonitorIADesktop() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([mensajeInicial])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensajes])

  const enviar = (texto = input.trim()) => {
    if (!texto) return
    setMensajes(m => [...m, { id: Date.now().toString(), rol: 'user', texto }])
    setInput('')
    setCargando(true)
    setTimeout(() => { setMensajes(m => [...m, obtenerRespuesta(texto)]); setCargando(false) }, 700)
  }

  const lastTabla = [...mensajes].reverse().find(m => m.tabla)?.tabla

  return (
    <div className="flex h-full overflow-hidden p-5 gap-5">
      {/* Left: Chat */}
      <div className="w-96 shrink-0 flex flex-col gap-3">
        {/* Header */}
        <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[rgba(38,183,255,0.12)] border border-[rgba(38,183,255,0.25)] flex items-center justify-center">
            <Bot size={18} className="text-[#26B7FF]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#d8e2ff]">Monitor Interactivo IA</p>
            <p className="text-xs text-[#8c919d]">Asistente analítico inmobiliario</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2fe0a2] animate-pulse" />
            <span className="text-[10px] text-[#2fe0a2]">online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 glass rounded-xl overflow-y-auto p-4 flex flex-col gap-3">
          {mensajes.map(m => (
            <div key={m.id} className={`flex gap-2 ${m.rol === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                m.rol === 'ia'
                  ? 'bg-[rgba(38,183,255,0.12)] border border-[rgba(38,183,255,0.2)]'
                  : 'bg-[rgba(47,224,162,0.12)] border border-[rgba(47,224,162,0.2)]'
              }`}>
                {m.rol === 'ia' ? <Bot size={12} className="text-[#26B7FF]" /> : <User size={12} className="text-[#2fe0a2]" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                m.rol === 'ia'
                  ? 'bg-[rgba(255,255,255,0.05)] text-[#c2c6d3] rounded-tl-none'
                  : 'bg-[rgba(47,224,162,0.08)] border border-[rgba(47,224,162,0.15)] text-[#d8e2ff] rounded-tr-none'
              }`}>
                {m.texto}
                {m.tabla && <p className="mt-1 text-[10px] text-[#26B7FF]">→ {m.tabla.length} resultados en la tabla</p>}
              </div>
            </div>
          ))}
          {cargando && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-[rgba(38,183,255,0.12)] border border-[rgba(38,183,255,0.2)] flex items-center justify-center">
                <Bot size={12} className="text-[#26B7FF]" />
              </div>
              <div className="bg-[rgba(255,255,255,0.05)] rounded-2xl rounded-tl-none px-3 py-2 flex items-center gap-1">
                {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#26B7FF] animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Sugerencias */}
        <div className="flex flex-wrap gap-1.5">
          {sugerencias.map(s => (
            <button key={s} onClick={() => enviar(s)}
              className="text-[10px] px-2.5 py-1 rounded-full glass border border-[rgba(38,183,255,0.15)] text-[#8c919d] hover:text-[#26B7FF] hover:border-[rgba(38,183,255,0.35)] transition-all">
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && enviar()}
            placeholder="Tu pregunta..."
            className="flex-1 glass rounded-xl px-4 py-2.5 text-sm text-[#d8e2ff] placeholder:text-[#424751] bg-transparent outline-none border border-white/10 focus:border-[rgba(38,183,255,0.4)]"
          />
          <button onClick={() => enviar()} disabled={!input.trim() || cargando}
            className="w-10 h-10 rounded-xl bg-[#26B7FF] flex items-center justify-center shrink-0 disabled:opacity-40 transition-all hover:bg-[#4dc8ff]">
            <Send size={14} className="text-[#03132d]" />
          </button>
        </div>
      </div>

      {/* Right: Data table */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Toolbar */}
        <div className="glass rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#26B7FF]" />
            <span className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider">Resultados IA</span>
            {lastTabla && <span className="text-xs text-[#8c919d]">— {lastTabla.length} propiedades</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => enviar('propiedades disponibles')}
              className="glass px-3 py-1.5 rounded-lg text-xs text-[#c2c6d3] flex items-center gap-1.5 hover:text-[#26B7FF] transition-all">
              <Filter size={12} /> Filtrar
            </button>
            <button onClick={() => enviar('resumen estadístico')}
              className="glass px-3 py-1.5 rounded-lg text-xs text-[#c2c6d3] flex items-center gap-1.5 hover:text-[#26B7FF] transition-all">
              <Compass size={12} /> Explorar
            </button>
            {lastTabla && (
              <button onClick={() => exportarCSV(lastTabla)}
                className="glass px-3 py-1.5 rounded-lg text-xs text-[#26B7FF] border border-[rgba(38,183,255,0.3)] flex items-center gap-1.5">
                <Share2 size={12} /> Exportar CSV
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 glass rounded-xl overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="border-b border-white/10 bg-[rgba(3,19,45,0.8)] backdrop-blur-sm">
                  {['ID', 'Propiedad', 'Distrito', 'Precio', 'Precio/m²', 'Área', 'Dorm.', 'Estado', 'ROI', 'Var.'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#26B7FF] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(lastTabla ?? propiedades).map((p, i) => (
                  <tr key={p.id} className={`border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-all ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}`}>
                    <td className="px-4 py-3 text-xs font-mono text-[#8c919d]">{p.id}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-[#d8e2ff] max-w-[180px]">
                      <div className="flex items-center gap-2">
                        <img src={p.imagen} alt="" className="w-8 h-6 rounded object-cover shrink-0" />
                        <span className="truncate">{p.titulo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#c2c6d3]">{p.distrito}</td>
                    <td className="px-4 py-3 text-xs font-bold text-[#26B7FF] font-mono whitespace-nowrap">{formatSoles(p.precio)}</td>
                    <td className="px-4 py-3 text-xs text-[#a7c8ff] font-mono">S/ {p.precioM2.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-[#c2c6d3]">{p.area} m²</td>
                    <td className="px-4 py-3 text-xs text-[#c2c6d3] text-center">{p.dormitorios}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        p.estado === 'Disponible' ? 'bg-[rgba(47,224,162,0.12)] text-[#2fe0a2]' :
                        p.estado === 'En negociación' ? 'bg-[rgba(38,183,255,0.12)] text-[#26B7FF]' :
                        'bg-[rgba(255,255,255,0.06)] text-[#8c919d]'
                      }`}>{p.estado}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-[#2fe0a2]">{p.roi}%</td>
                    <td className="px-4 py-3 text-xs font-semibold text-[#2fe0a2]">+{p.variacion}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {lastTabla && (
            <div className="border-t border-white/10 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-[#8c919d]">{lastTabla.length} registros · actualizado ahora</span>
              <button onClick={() => exportarCSV(lastTabla)}
                className="flex items-center gap-1.5 text-xs font-bold text-[#26B7FF] hover:text-[#4dc8ff] transition-all">
                <Download size={12} /> DESCARGAR TABLA
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
