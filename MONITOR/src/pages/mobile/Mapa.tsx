import { useState } from 'react'
import DeckGL from '@deck.gl/react'
import { GeoJsonLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import Map from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin, Home, TrendingUp } from 'lucide-react'
import { propiedades, preciosPorDistrito, formatSoles } from '../../data/realData'
import { limaDistritosGeo } from '../../data/limaDistritosGeo'
import { Badge } from '../../components/Badge'
import { useNavigate } from 'react-router-dom'

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

const INITIAL_VIEW = {
  longitude: -77.0428,
  latitude: -12.0964,
  zoom: 11.5,
  pitch: 30,
  bearing: 0,
}

const GEO_NAMES = new Set(limaDistritosGeo.features.map(f => f.properties.nombre))

// Centre coords for district labels
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

type Distrito = {
  nombre: string
  coords: [number, number]
  precioM2: number
  variacion: number
  propiedades: number
  roi: number
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

const modosMapa = ['Precio/m²', 'Crecimiento', 'Rentabilidad']

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

function estadoColor(estado: string): [number, number, number, number] {
  if (estado === 'Disponible') return [47, 224, 162, 220]
  if (estado === 'Reservado')  return [255, 180, 100, 220]
  return [255, 100, 100, 220]
}

export function Mapa() {
  const navigate = useNavigate()
  const [modo, setModo] = useState('Precio/m²')
  const [propSeleccionada, setPropSeleccionada] = useState<string | null>(null)

  const propActiva = propiedades.find(p => p.id === propSeleccionada)
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
      if (modo === 'Rentabilidad') return roiColor(d.roi)
      if (modo === 'Crecimiento')  return crecimientoColor(d.variacion)
      return precioColor(d.precioM2)
    },
    getLineColor: [255, 255, 255, 25] as [number, number, number, number],
    lineWidthMinPixels: 0.5,
    pickable: false,
    updateTriggers: { getFillColor: modo },
  })

  const textLayer = new TextLayer<Distrito>({
    id: 'labels',
    data: DISTRITOS,
    getPosition: d => d.coords,
    getText: d => d.nombre,
    getSize: 11,
    getColor: [216, 226, 255, 210] as [number, number, number, number],
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'top',
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 'bold',
  })

  const pinsLayer = new ScatterplotLayer<typeof propiedades[0]>({
    id: 'properties',
    data: propiedades,
    getPosition: d => [d.coordenadas.lng, d.coordenadas.lat] as [number, number],
    getRadius: d => d.id === propSeleccionada ? 14 : 8,
    getFillColor: d => estadoColor(d.estado),
    getLineColor: [255, 255, 255, 120] as [number, number, number, number],
    lineWidthMinPixels: 1,
    stroked: true,
    pickable: true,
    radiusMinPixels: 6,
    radiusMaxPixels: 18,
    onClick: info => {
      if (info.object) {
        const id = (info.object as typeof propiedades[0]).id
        setPropSeleccionada(id === propSeleccionada ? null : id)
      }
    },
    updateTriggers: { getRadius: propSeleccionada },
  })

  const legendItems: Record<string, Array<[string, number]>> = {
    'Precio/m²':   [['9.6k+', 1], ['7k', 0.49], ['5.5k', 0.2], ['4.5k', 0]],
    'Crecimiento': [['7.5%+', 1], ['4.75%', 0.5], ['2%', 0]],
    'Rentabilidad':[['7.2%+', 1], ['6.2%', 0.5], ['5.2%', 0]],
  }

  const legendLabel: Record<string, string> = {
    'Precio/m²': 'S/m²', 'Crecimiento': 'Var. mensual', 'Rentabilidad': 'ROI est.',
  }

  function legendColor(t: number): string {
    if (modo === 'Rentabilidad') {
      const c = roiColor(5.2 + t * 2.0)
      return `rgba(${c[0]},${c[1]},${c[2]},0.9)`
    }
    if (modo === 'Crecimiento') {
      const c = crecimientoColor(2.0 + t * 5.5)
      return `rgba(${c[0]},${c[1]},${c[2]},0.9)`
    }
    const c = precioColor(4500 + t * 5100)
    return `rgba(${c[0]},${c[1]},${c[2]},0.9)`
  }

  return (
    <div className="h-full w-full relative bg-[#03132d]">
      <DeckGL
        initialViewState={INITIAL_VIEW}
        controller={true}
        layers={[heatLayer, textLayer, pinsLayer]}
        getCursor={({ isDragging, isHovering }) => isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'}
        style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0' }}
      >
        <Map mapStyle={MAP_STYLE} />
      </DeckGL>

      {/* Mode tabs */}
      <div className="absolute top-4 left-4 right-4 z-10 flex gap-2 overflow-x-auto">
        {modosMapa.map(m => (
          <button
            key={m}
            onClick={() => setModo(m)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${
              modo === m
                ? 'bg-[rgba(38,183,255,0.95)] text-[#03132d] border-[#26B7FF]'
                : 'bg-[rgba(3,19,45,0.82)] backdrop-blur-sm text-[#c2c6d3] border-white/20'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute top-16 right-4 z-10 bg-[rgba(3,19,45,0.88)] backdrop-blur-sm rounded-lg p-2.5 border border-white/10">
        <p className="text-[9px] text-[#8c919d] mb-1.5 font-semibold uppercase tracking-wider">
          {legendLabel[modo]}
        </p>
        {legendItems[modo].map(([v, t]) => (
          <div key={v} className="flex items-center gap-1.5 mb-1 last:mb-0">
            <div className="w-3.5 h-2 rounded-sm" style={{ background: legendColor(t) }} />
            <span className="text-[9px] text-[#c2c6d3]">{v}</span>
          </div>
        ))}
      </div>

      {/* Bottom overlay */}
      {propActiva ? (
        <div className="absolute bottom-20 left-4 right-4 z-10 bg-[rgba(3,19,45,0.95)] backdrop-blur-sm rounded-xl p-3 border border-[rgba(38,183,255,0.3)]">
          <div className="flex gap-3 items-start">
            <img src={propActiva.imagen} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <Badge label={propActiva.estado} />
                <span className="text-[10px] font-mono text-[#8c919d]">{propActiva.id}</span>
              </div>
              <p className="text-sm font-semibold text-[#d8e2ff] line-clamp-1">{propActiva.titulo}</p>
              <p className="text-xs font-bold text-[#26B7FF]">{formatSoles(propActiva.precio)}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => navigate(`/propiedad/${propActiva.id}`)}
              className="flex-1 py-2 rounded-lg bg-[rgba(38,183,255,0.15)] text-[#26B7FF] text-xs font-semibold border border-[rgba(38,183,255,0.3)]"
            >
              Ver detalle
            </button>
            <button
              onClick={() => setPropSeleccionada(null)}
              className="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-[#8c919d] text-xs border border-white/10"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-20 left-4 right-4 z-10 grid grid-cols-3 gap-2">
          {[
            { icon: MapPin,     label: 'Distritos',   value: `${DISTRITOS.length}` },
            { icon: Home,       label: 'Proyectos',   value: `${totalUnidades}` },
            { icon: TrendingUp, label: 'Var. prom.',  value: `+${varPromedio}%` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-[rgba(3,19,45,0.85)] backdrop-blur-sm rounded-lg p-2 text-center border border-white/10">
              <Icon size={12} className="text-[#26B7FF] mx-auto mb-1" />
              <p className="text-sm font-bold text-[#d8e2ff]">{value}</p>
              <p className="text-[9px] text-[#8c919d]">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
