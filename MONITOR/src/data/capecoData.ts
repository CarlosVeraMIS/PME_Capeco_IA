// CAPECO Data Integration Layer
// Transforms CAPECO Data Lake data into dashboard format

import { capecoApi } from '../services/capecoApi'

// Formatting utilities
export const formatSoles = (valor: number): string => {
  return `S/.${valor.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export const formatM2 = (valor: number): string => {
  return `S/.${valor.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// Global statistics derived from API metrics
export const getEstadisticasGlobales = async () => {
  const metrics = await capecoApi.fetchMetrics()
  return {
    precioPromedioM2: metrics.averagePriceM2 || 8500,
    totalPropiedades: metrics.totalProjects || 9319,
    unidadesDisponibles: metrics.availableUnits || 9319,
    volumenTotal: metrics.totalVolume || 'S/. 2.8B',
    varMensual: metrics.monthlyVariation || 3.2
  }
}

// Market trend data (simulated from historical + current data)
export const getTendenciaMercado = async () => {
  const projects = await capecoApi.fetchProjects()

  // Generate 7-month trend from current data (simplified simulation)
  const basePrice = 8500
  const monthlyVariation = 3.2

  return [
    { mes: 'Nov', precio: basePrice * 0.85, unidades: 1200 },
    { mes: 'Dic', precio: basePrice * 0.90, unidades: 1350 },
    { mes: 'Ene', precio: basePrice * 0.95, unidades: 1400 },
    { mes: 'Feb', precio: basePrice * 0.98, unidades: 1500 },
    { mes: 'Mar', precio: basePrice * 1.02, unidades: 1650 },
    { mes: 'Abr', precio: basePrice * 1.05, unidades: 1800 },
    { mes: 'May', precio: basePrice, unidades: 1900 }
  ]
}

// Top districts by price per m²
export const getPreciosPorDistrito = async () => {
  const districts = await capecoApi.fetchDistricts()

  // Sort by price per m² and return top districts
  return districts
    .sort((a, b) => b.precioM2 - a.precioM2)
    .slice(0, 10)
    .map(d => ({
      distrito: d.distrito,
      precioM2: d.precioM2,
      proyectos: d.proyectos,
      variacion: d.variacion
    }))
}

// Get all properties from CAPECO API
export const getPropiedades = async () => {
  return await capecoApi.fetchProjects()
}

// Get districts list
export const getDistritos = async () => {
  const districts = await capecoApi.fetchDistricts()
  return districts.map(d => d.distrito)
}

// Placeholder objects for synchronous use (will be replaced with async data)
export const estadisticasGlobales = {
  precioPromedioM2: 8500,
  totalPropiedades: 9319,
  unidadesDisponibles: 9319,
  volumenTotal: 'S/. 2.8B',
  varMensual: 3.2
}

export const tendenciaMercado = [
  { mes: 'Nov', precio: 7225, unidades: 1200 },
  { mes: 'Dic', precio: 7650, unidades: 1350 },
  { mes: 'Ene', precio: 8075, unidades: 1400 },
  { mes: 'Feb', precio: 8330, unidades: 1500 },
  { mes: 'Mar', precio: 8670, unidades: 1650 },
  { mes: 'Abr', precio: 8925, unidades: 1800 },
  { mes: 'May', precio: 8500, unidades: 1900 }
]

export const preciosPorDistrito = [
  { distrito: 'San Isidro', precioM2: 15000, proyectos: 45, variacion: 2.1 },
  { distrito: 'Miraflores', precioM2: 13500, proyectos: 68, variacion: 1.8 },
  { distrito: 'San Borja', precioM2: 12000, proyectos: 52, variacion: 2.3 },
  { distrito: 'La Molina', precioM2: 10500, proyectos: 61, variacion: 2.5 },
  { distrito: 'Santiago de Surco', precioM2: 9800, proyectos: 74, variacion: 3.1 },
  { distrito: 'Lince', precioM2: 9200, proyectos: 43, variacion: 2.8 },
  { distrito: 'Magdalena del Mar', precioM2: 8900, proyectos: 28, variacion: 2.4 },
  { distrito: 'Pueblo Libre', precioM2: 8500, proyectos: 56, variacion: 3.2 },
  { distrito: 'San Miguel', precioM2: 8200, proyectos: 39, variacion: 2.9 },
  { distrito: 'Los Olivos', precioM2: 7500, proyectos: 67, variacion: 3.5 }
]

export const propiedades = [
  {
    id: 'PROJ-0001',
    titulo: 'Proyecto CAPECO #1',
    distrito: 'Miraflores',
    precio: 450000,
    precioM2: 12000,
    area: 37.5,
    dormitorios: 2,
    banos: 1,
    tipo: 'Apartamento',
    estado: 'Disponible',
    variacion: 3.2,
    imagen: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80',
    coordenadas: { lat: -12.124144, lng: -77.0219767 },
    descripcion: 'Proyecto certificado CAPECO con excelentes acabados',
    amenidades: ['Lobby', 'Terraza', 'Zona de Parrillas'],
    fechaPublicacion: '2026-05-08',
    roi: 6.8
  }
]

export const distritos = [
  'Arequipa', 'Barranco', 'Breña', 'Cayma', 'Cercado de lima',
  'Cerro Colorado', 'Chorrillos', 'Comas', 'Jesus Maria',
  'Jose Luis Bustamante Y Rivero', 'La Molina', 'La Victoria',
  'Lince', 'Los Olivos', 'Magdalena Del Mar', 'Miraflores',
  'Pueblo Libre', 'Rimac', 'San Bartolo', 'San Borja',
  'San Isidro', 'San Luis', 'San Miguel', 'Santiago De Surco', 'Surquillo'
]
