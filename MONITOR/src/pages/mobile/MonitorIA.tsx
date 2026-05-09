import { useState, useRef, useEffect } from 'react'
import { Send, Download, Bot, User, Filter, Share2, Compass } from 'lucide-react'
import { propiedades, formatSoles } from '../../data/capecoData'

type Mensaje = {
  id: string
  rol: 'ia' | 'user'
  texto: string
  tabla?: typeof propiedades
}

const respuestasIA: { match: RegExp; respuesta: string; filtro?: (p: typeof propiedades[0]) => boolean }[] = [
  {
    match: /barato|econom|mínimo|menor precio|cheap/i,
    respuesta: 'Encontré las propiedades con menor precio disponibles en Lima:',
    filtro: p => p.precio < 700000,
  },
  {
    match: /miraflores/i,
    respuesta: 'Aquí tienes todas las propiedades en Miraflores:',
    filtro: p => p.distrito === 'Miraflores',
  },
  {
    match: /san isidro/i,
    respuesta: 'Propiedades disponibles en San Isidro:',
    filtro: p => p.distrito === 'San Isidro',
  },
  {
    match: /surco|santiago/i,
    respuesta: 'Propiedades en Santiago de Surco:',
    filtro: p => p.distrito === 'Surco',
  },
  {
    match: /roi|rentab|invers/i,
    respuesta: 'Propiedades ordenadas por mayor ROI estimado:',
    filtro: undefined,
  },
  {
    match: /disponible/i,
    respuesta: 'Propiedades actualmente disponibles (sin reserva):',
    filtro: p => p.estado === 'Disponible',
  },
  {
    match: /casa/i,
    respuesta: 'Casas disponibles en el inventario:',
    filtro: p => p.tipo === 'Casa',
  },
  {
    match: /departamento|apto|flat/i,
    respuesta: 'Departamentos y flats en el inventario:',
    filtro: p => p.tipo === 'Apartamento',
  },
  {
    match: /precio.*m2|m2|metro/i,
    respuesta: 'Aquí tienes el ranking de precio por m² por distrito:',
    filtro: undefined,
  },
  {
    match: /resumen|estadística|total|cuantos|cuántos/i,
    respuesta: `Resumen del inventario actual:\n• 312 proyectos cargados\n• 8 distritos activos\n• Precio/m² promedio: S/ 6,485\n• ROI promedio: 6.2%\n• Variación mensual: +4.8%`,
    filtro: undefined,
  },
]

function obtenerRespuesta(pregunta: string): Mensaje {
  for (const r of respuestasIA) {
    if (r.match.test(pregunta)) {
      let tabla = propiedades
      if (r.filtro) tabla = propiedades.filter(r.filtro)
      if (pregunta.match(/roi|rentab/i)) tabla = [...propiedades].sort((a, b) => b.roi - a.roi)
      return {
        id: Date.now().toString(),
        rol: 'ia',
        texto: r.respuesta,
        tabla: tabla.length > 0 ? tabla : undefined,
      }
    }
  }
  return {
    id: Date.now().toString(),
    rol: 'ia',
    texto: `Aquí tienes el inventario completo de propiedades en Lima Metropolitana para tu consulta "${pregunta}":`,
    tabla: propiedades,
  }
}

function exportarCSV(tabla: typeof propiedades) {
  const headers = ['ID', 'Título', 'Distrito', 'Precio (S/)', 'Precio/m²', 'Área m²', 'Dorm.', 'Estado', 'ROI%', 'Variación%']
  const rows = tabla.map(p => [p.id, p.titulo, p.distrito, p.precio, p.precioM2, p.area, p.dormitorios, p.estado, p.roi, p.variacion])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'monitor_ia_resultados.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const mensajeInicial: Mensaje = {
  id: '0',
  rol: 'ia',
  texto: '¡Hola! Tengo cargados los 312 proyectos cruzados. Pídeme resúmenes estadísticos o filtros que no estén en tu Dashboard.',
  tabla: propiedades,
}

export function MonitorIA() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([mensajeInicial])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const enviar = () => {
    const texto = input.trim()
    if (!texto) return
    const msgUser: Mensaje = { id: Date.now().toString(), rol: 'user', texto }
    setMensajes(m => [...m, msgUser])
    setInput('')
    setCargando(true)
    setTimeout(() => {
      setMensajes(m => [...m, obtenerRespuesta(texto)])
      setCargando(false)
    }, 800)
  }

  const lastTabla = [...mensajes].reverse().find(m => m.tabla)?.tabla

  return (
    <div className="flex flex-col h-full bg-[#03132d]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-[#d8e2ff]">Monitor Interactivo IA</h1>
          <p className="text-xs text-[#8c919d]">Asistente analítico inmobiliario</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-[rgba(38,183,255,0.12)] flex items-center justify-center border border-[rgba(38,183,255,0.2)]">
          <Bot size={16} className="text-[#26B7FF]" />
        </div>
      </div>

      {/* Chat + tabla */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {mensajes.map(m => (
          <div key={m.id} className={`flex gap-2 ${m.rol === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              m.rol === 'ia'
                ? 'bg-[rgba(38,183,255,0.12)] border border-[rgba(38,183,255,0.2)]'
                : 'bg-[rgba(47,224,162,0.12)] border border-[rgba(47,224,162,0.2)]'
            }`}>
              {m.rol === 'ia'
                ? <Bot size={14} className="text-[#26B7FF]" />
                : <User size={14} className="text-[#2fe0a2]" />}
            </div>

            <div className="flex-1 max-w-[85%]">
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                m.rol === 'ia'
                  ? 'glass text-[#c2c6d3] rounded-tl-none'
                  : 'bg-[rgba(47,224,162,0.08)] border border-[rgba(47,224,162,0.15)] text-[#d8e2ff] rounded-tr-none'
              }`}>
                {m.texto}
              </div>

              {m.tabla && m.tabla.length > 0 && (
                <div className="mt-2 glass rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left px-3 py-2 text-[#26B7FF] font-semibold">Propiedad</th>
                          <th className="text-left px-3 py-2 text-[#26B7FF] font-semibold">Distrito</th>
                          <th className="text-right px-3 py-2 text-[#26B7FF] font-semibold">Precio</th>
                          <th className="text-right px-3 py-2 text-[#26B7FF] font-semibold">ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.tabla.map((p, i) => (
                          <tr key={p.id} className={`border-b border-white/5 last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                            <td className="px-3 py-2 text-[#d8e2ff] font-medium truncate max-w-[120px]">{p.titulo}</td>
                            <td className="px-3 py-2 text-[#8c919d]">{p.distrito}</td>
                            <td className="px-3 py-2 text-right text-[#26B7FF] font-mono font-bold">{formatSoles(p.precio)}</td>
                            <td className="px-3 py-2 text-right text-[#2fe0a2] font-semibold">{p.roi}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={() => exportarCSV(m.tabla!)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-[#26B7FF] border-t border-white/10 hover:bg-white/5 transition-all"
                  >
                    <Download size={12} /> DESCARGAR TABLA
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {cargando && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-[rgba(38,183,255,0.12)] border border-[rgba(38,183,255,0.2)] flex items-center justify-center shrink-0">
              <Bot size={14} className="text-[#26B7FF]" />
            </div>
            <div className="glass rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#26B7FF] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      <div className="px-4 pb-2 flex gap-2">
        {[
          { icon: Compass, label: 'Explorar', pregunta: 'resumen estadístico general' },
          { icon: Filter, label: 'Filtros', pregunta: 'propiedades disponibles' },
          { icon: Share2, label: 'Exportar', action: () => lastTabla && exportarCSV(lastTabla) },
        ].map(({ icon: Icon, label, pregunta, action }) => (
          <button
            key={label}
            onClick={() => action ? action() : (setInput(pregunta!), setTimeout(enviar, 100))}
            className="flex items-center gap-1.5 glass px-3 py-2 rounded-full text-xs font-semibold text-[#c2c6d3] hover:text-[#26B7FF] hover:border-[rgba(38,183,255,0.3)] border border-transparent transition-all"
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-1 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="TU PREGUNTA..."
          className="flex-1 glass rounded-2xl px-4 py-3 text-sm text-[#d8e2ff] placeholder:text-[#424751] bg-transparent outline-none border border-white/10 focus:border-[rgba(38,183,255,0.4)]"
        />
        <button
          onClick={enviar}
          disabled={!input.trim() || cargando}
          className="w-11 h-11 rounded-2xl bg-[#26B7FF] flex items-center justify-center shrink-0 disabled:opacity-40 transition-all"
        >
          <Send size={16} className="text-[#03132d]" />
        </button>
      </div>
    </div>
  )
}
