import { useState } from 'react'
import DeckGL from '@deck.gl/react'
import { TextLayer } from '@deck.gl/layers'
import Map from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers'
import { Layers, MapPin, Home, TrendingUp } from 'lucide-react'
import { propiedades, preciosPorDistrito, formatSoles } from '../../data/realData'
import { limaDistritosGeo } from '../../data/limaDistritosGeo'
import { Badge } from '../../components/Badge'
import { useNavigate } from 'react-router-dom'

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

const INITIAL_VIEW = {
  longitude: -77.0428,
  latitude: -12.0964,
  zoom: 12,
  pitch: 35,
  bearing: 0,
}

const GEO_NAMES = new Set(limaDistritosGeo.features.map(f => f.properties.nombre))

type Distrito = {
  nombre: string
  coords: [number, number]
  precioM2: number
  variacion: number
  propiedades: number
  roi: number
}

// Centre coords for labels only
const LABEL_COORDS: Record<string, [number, number]> = {
  'Magdalena Del Mar': [-77.073, -12.087],
  'San Miguel':        [-77.094, -12.071],
  'Pueblo Libre':      [-77.072, -12.076],
  'Breña':             [-77.059, -12.054],
  'San Isidro':        [-77.048, -12.093],
  'Jesus Maria':       [-77.053, -12.067],
  'Cercado de lima':   [-77.039, -12.049],
  'Rimac':             [-77.032, -12.037],
  'Lince':             [-77.035, -12.079],
  'Miraflores':        [-77.032, -12.117],
  'Barranco':          [-77.023, -12.151],
  'La Victoria':       [-77.014, -12.063],
  'Surquillo':         [-77.013, -12.110],
  'San Borja':         [-77.003, -12.105],
  'Chorrillos':        [-77.015, -12.168],
  'Santiago De Surco': [-76.995, -12.155],
  'San Luis':          [-76.990, -12.080],
  'La Molina':         [-76.928, -12.083],
  'Los Olivos':        [-77.068, -11.973],
  'Comas':             [-77.037, -11.935],
}

const DISTRITOS: Distrito[] = preciosPorDistrito
  .filter(d => GEO_NAMES.has(d.distrito))
  .map(d => ({
    nombre: d.distrito,
    coords: LABEL_COORDS[d.distrito] ?? [0, 0],
    precioM2: d.precioM2,
    variacion: d.variacion,
    propiedades: d.propiedades,
    roi: +(4.5 + d.variacion * 0.35).toFixed(1),
  }))

const capas = ['Precio/m²', 'Crecimiento', 'Rentabilidad', 'Proyectos']

function lerp(a: number, b: number, t: number): number { return Math.round(a + (b - a) * t) }

// Precio/m²: actual range 4500–9600 → dark-blue → cyan → yellow
function precioColor(precioM2: number): [number, number, number, number] {
  const t = Math.min(Math.max((precioM2 - 4500) / 5100, 0), 1)
  if (t < 0.5) { const s = t * 2; return [lerp(20, 38, s), lerp(60, 183, s), lerp(200, 255, s), lerp(185, 215, s)] }
  const s = (t - 0.5) * 2
  return [lerp(38, 255, s), lerp(183, 230, s), lerp(255, 30, s), lerp(215, 230, s)]
}

// Crecimiento: actual range 2.0–7.5 → red → yellow → green
function crecimientoColor(v: number): [number, number, number, number] {
  const t = Math.min(Math.max((v - 2.0) / 5.5, 0), 1)
  if (t < 0.5) { const s = t * 2; return [lerp(220, 255, s), lerp(40, 210, s), lerp(40, 30, s), 205] }
  const s = (t - 0.5) * 2
  return [lerp(255, 40, s), lerp(210, 220, s), lerp(30, 80, s), 215]
}

// Rentabilidad: actual range 5.2–7.2 → purple → gold
function roiColor(roi: number): [number, number, number, number] {
  const t = Math.min(Math.max((roi - 5.2) / 2.0, 0), 1)
  if (t < 0.5) { const s = t * 2; return [lerp(120, 240, s), lerp(40, 140, s), lerp(210, 30, s), lerp(185, 215, s)] }
  const s = (t - 0.5) * 2
  return [lerp(240, 255, s), lerp(140, 205, s), lerp(30, 20, s), lerp(215, 230, s)]
}

// Proyectos: log scale (1–44) → teal → magenta
function proyectosColor(n: number): [number, number, number, number] {
  const t = Math.min(Math.max(Math.log(n + 1) / Math.log(45), 0), 1)
  if (t < 0.5) { const s = t * 2; return [lerp(20, 180, s), lerp(200, 60, s), lerp(210, 255, s), lerp(170, 210, s)] }
  const s = (t - 0.5) * 2
  return [lerp(180, 255, s), lerp(60, 20, s), lerp(255, 190, s), lerp(210, 225, s)]
}

function estadoColor(estado: string): [number, number, number, number] {
  if (estado === 'Disponible') return [47, 224, 162, 220]
  if (estado === 'Reservado')  return [255, 180, 100, 220]
  return [255, 100, 100, 220]
}

export function MapaDesktop() {
  const navigate = useNavigate()
  const [capaActiva, setCapaActiva] = useState('Precio/m²')
  const [propActiva, setPropActiva] = useState<string | null>(null)

  const propSeleccionada = propiedades.find(p => p.id === propActiva)

  const distritosEnMapa = preciosPorDistrito.filter(d => GEO_NAMES.has(d.distrito))
  const totalUnidades = distritosEnMapa.reduce((s, d) => s + d.propiedades, 0)
  const varPromedio = (distritosEnMapa.reduce((s, d) => s + d.variacion, 0) / distritosEnMapa.length).toFixed(1)

  const distritoMetric: Record<string, Distrito> = Object.fromEntries(DISTRITOS.map(d => [d.nombre, d]))

  const heatLayer = new GeoJsonLayer({
    id: 'distritos-fill',
    data: limaDistritosGeo,
    filled: true,
    stroked: true,
    getFillColor: (f: any) => {
      const d = distritoMetric[f.properties.nombre]
      if (!d) return [0, 0, 0, 0]
      if (capaActiva === 'Rentabilidad') return roiColor(d.roi)
      if (capaActiva === 'Crecimiento')  return crecimientoColor(d.variacion)
      if (capaActiva === 'Proyectos')    return proyectosColor(d.propiedades)
      return precioColor(d.precioM2)
    },
    getLineColor: [255, 255, 255, 30] as [number, number, number, number],
    lineWidthMinPixels: 0.5,
    pickable: false,
    updateTriggers: { getFillColor: capaActiva },
  })

  const textLayer = new TextLayer<Distrito>({
    id: 'labels',
    data: DISTRITOS,
    getPosition: d => d.coords,
    getText: d => d.nombre,
    getSize: 12,
    getColor: [216, 226, 255, 220] as [number, number, number, number],
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'top',
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 'bold',
  })

  const pinsLayer = new ScatterplotLayer<typeof propiedades[0]>({
    id: 'properties',
    data: propiedades,
    getPosition: d => [d.coordenadas.lng, d.coordenadas.lat] as [number, number],
    getRadius: d => d.id === propActiva ? 16 : 9,
    getFillColor: d => estadoColor(d.estado),
    getLineColor: [255, 255, 255, 140] as [number, number, number, number],
    lineWidthMinPixels: 1.5,
    stroked: true,
    pickable: true,
    radiusMinPixels: 7,
    radiusMaxPixels: 20,
    onClick: info => {
      if (info.object) {
        const id = (info.object as typeof propiedades[0]).id
        setPropActiva(id === propActiva ? null : id)
      }
    },
    updateTriggers: { getRadius: propActiva },
  })

  const legendItems: Record<string, Array<[string, number]>> = {
    'Precio/m²':   [['9.6k+', 1], ['7k', 0.49], ['5.5k', 0.2], ['4.5k', 0]],
    'Crecimiento': [['7.5%+', 1], ['4.75%', 0.5], ['2%', 0]],
    'Rentabilidad':[['7.2%+', 1], ['6.2%', 0.5], ['5.2%', 0]],
    'Proyectos':   [['40+', 1], ['10', 0.48], ['3', 0.2], ['1', 0]],
  }

  const legendLabel: Record<string, string> = {
    'Precio/m²': 'S/m²', 'Crecimiento': 'Var. mensual', 'Rentabilidad': 'ROI est.', 'Proyectos': 'Proyectos',
  }

  function legendColor(t: number): string {
    if (capaActiva === 'Rentabilidad') {
      const c = roiColor(5.2 + t * 2.0)
      return `rgba(${c[0]},${c[1]},${c[2]},0.9)`
    }
    if (capaActiva === 'Crecimiento') {
      const c = crecimientoColor(2.0 + t * 5.5)
      return `rgba(${c[0]},${c[1]},${c[2]},0.9)`
    }
    if (capaActiva === 'Proyectos') {
      const n = Math.round(Math.pow(45, t) - 1)
      const c = proyectosColor(Math.max(n, 1))
      return `rgba(${c[0]},${c[1]},${c[2]},0.9)`
    }
    const c = precioColor(4500 + t * 5100)
    return `rgba(${c[0]},${c[1]},${c[2]},0.9)`
  }

  return (
    <div className="flex h-full overflow-hidden p-4 gap-4">
      {/* Mapa principal */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between glass rounded-xl px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-[#26B7FF]" />
            <span className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider">Capas de Análisis</span>
          </div>
          <div className="flex gap-2">
            {capas.map(c => (
              <button
                key={c}
                onClick={() => setCapaActiva(c)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  capaActiva === c
                    ? 'bg-[rgba(38,183,255,0.15)] text-[#26B7FF] border border-[rgba(38,183,255,0.3)]'
                    : 'text-[#8c919d] hover:text-[#c2c6d3]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Mapa */}
        <div className="flex-1 glass rounded-xl relative overflow-hidden min-h-0">
          <DeckGL
            initialViewState={INITIAL_VIEW}
            controller={true}
            layers={[heatLayer, textLayer, pinsLayer]}
            getCursor={({ isDragging, isHovering }) => isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'}
            style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0' }}
          >
            <Map mapStyle={MAP_STYLE} />
          </DeckGL>

          {/* Legend overlay */}
          <div className="absolute bottom-4 left-4 z-10 bg-[rgba(3,19,45,0.88)] backdrop-blur-sm rounded-lg p-3 border border-white/10">
            <p className="text-[9px] text-[#8c919d] mb-2 font-semibold uppercase tracking-wider">
              {legendLabel[capaActiva]}
            </p>
            <div className="flex flex-col gap-1">
              {legendItems[capaActiva].map(([v, t]) => (
                <div key={v} className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm" style={{ background: legendColor(t) }} />
                  <span className="text-[9px] text-[#c2c6d3]">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* North indicator */}
          <div className="absolute top-4 right-4 z-10 bg-[rgba(3,19,45,0.8)] backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center border border-white/10">
            <span className="text-xs font-bold text-[#26B7FF]">N</span>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          {[
            { icon: MapPin,     label: 'Distritos activos', value: `${DISTRITOS.length} distritos` },
            { icon: Home,       label: 'Proyectos en mapa',  value: `${totalUnidades} proyectos` },
            { icon: TrendingUp, label: 'Var. promedio',      value: `+${varPromedio}% mensual` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="glass rounded-lg px-4 py-3 flex items-center gap-3">
              <Icon size={14} className="text-[#26B7FF] shrink-0" />
              <div>
                <p className="text-xs text-[#8c919d]">{label}</p>
                <p className="text-sm font-bold text-[#d8e2ff]">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel lateral */}
      <div className="w-72 flex flex-col gap-3 overflow-y-auto shrink-0">
        {propSeleccionada ? (
          <div className="glass rounded-xl overflow-hidden">
            <img src={propSeleccionada.imagen} alt="" className="w-full h-36 object-cover" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge label={propSeleccionada.estado} />
                <span className="text-[10px] font-mono text-[#8c919d]">{propSeleccionada.id}</span>
              </div>
              <p className="text-sm font-bold text-[#d8e2ff] mb-1">{propSeleccionada.titulo}</p>
              <p className="text-xs text-[#8c919d] mb-3">{propSeleccionada.distrito}</p>
              <p className="text-lg font-bold text-[#26B7FF] mb-3">{formatSoles(propSeleccionada.precio)}</p>
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="glass rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[#8c919d]">Área</p>
                  <p className="font-bold text-[#d8e2ff]">{propSeleccionada.area} m²</p>
                </div>
                <div className="glass rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[#8c919d]">ROI</p>
                  <p className="font-bold text-[#2fe0a2]">{propSeleccionada.roi}%</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/propiedad/${propSeleccionada.id}`)}
                  className="flex-1 py-2 rounded-lg bg-[rgba(38,183,255,0.12)] text-[#26B7FF] text-xs font-semibold border border-[rgba(38,183,255,0.3)]"
                >
                  Ver detalle
                </button>
                <button
                  onClick={() => setPropActiva(null)}
                  className="px-3 py-2 rounded-lg glass text-[#8c919d] text-xs border border-white/10"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass rounded-xl p-4">
            <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-2">Selecciona un pin</p>
            <p className="text-xs text-[#8c919d]">Haz clic en cualquier propiedad del mapa para ver su detalle.</p>
          </div>
        )}

        <div className="glass rounded-xl p-4">
          <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-3">Distritos — Datos reales</p>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-64">
            {preciosPorDistrito.filter(d => GEO_NAMES.has(d.distrito)).map(d => (
              <div key={d.distrito} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                <div className="min-w-0">
                  <span className="text-xs text-[#c2c6d3] truncate block">{d.distrito}</span>
                  <span className="text-[10px] text-[#8c919d]">{d.propiedades} proy. · S/{(d.precioM2/1000).toFixed(1)}k/m²</span>
                </div>
                <span className={`text-xs font-semibold ml-2 shrink-0 ${d.variacion >= 0 ? 'text-[#2fe0a2]' : 'text-[#ffb4ab]'}`}>
                  {d.variacion >= 0 ? '+' : ''}{d.variacion}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider mb-2">Leyenda de Pines</p>
          <div className="flex flex-col gap-2">
            {[
              { color: 'bg-[#2fe0a2]', label: 'Disponible' },
              { color: 'bg-[#FFB464]', label: 'Reservado' },
              { color: 'bg-[#ff6464]', label: 'No disponible' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-xs text-[#c2c6d3]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
