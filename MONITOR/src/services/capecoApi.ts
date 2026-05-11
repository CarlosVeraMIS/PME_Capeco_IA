// CAPECO Data Lake API Service
// Note: Currently serving realData.ts (nexoinmobiliario.pe scrape)
// Future: Will integrate with actual API endpoint

import { propiedades as realDataProjects, distritos as realDataDistritos } from '../data/realData'

const API_BASE_URL = 'https://capeco-app.azurewebsites.net/api/v1/gold'

export interface CapecoProject {
  id: string
  titulo: string
  distrito: string
  precio: number
  precioM2: number
  area: number
  dormitorios: number
  banos: number
  tipo: string
  estado: string
  variacion: number
  imagen: string
  coordenadas: {
    lat: number
    lng: number
  }
  descripcion: string
  amenidades: string[]
  fechaPublicacion: string
  roi: number
}

export interface ApiMetrics {
  totalProjects: number
  averagePriceM2: number
  monthlyVariation: number
  availableUnits: number
  totalVolume: string
}

export interface DistrictMetrics {
  distrito: string
  precioM2: number
  propiedades: number
  variacion: number
}

// Data transformation function to map API response fields to CapecoProject format
function normalizeProject(rawData: any): CapecoProject {
  return {
    id: rawData.id || rawData.projectId || rawData.project_id || '',
    titulo: rawData.titulo || rawData.title || rawData.name || '',
    distrito: rawData.distrito || rawData.district || rawData.distrito_norm || rawData.location || '',
    precio: toNumber(rawData.precio || rawData.price || rawData.price_amount || rawData.total_price || 0),
    precioM2: toNumber(rawData.precioM2 || rawData.price_m2 || rawData.pricePerM2 || rawData.price_per_m2 || 0),
    area: toNumber(rawData.area || rawData.square_meters || rawData.area_m2 || 0),
    dormitorios: toNumber(rawData.dormitorios || rawData.bedrooms || rawData.bed_rooms || rawData.num_bedrooms || rawData.NRO_DORMITORIOS || 0),
    banos: toNumber(rawData.banos || rawData.bathrooms || rawData.bath_rooms || rawData.num_bathrooms || 0),
    tipo: rawData.tipo || rawData.type || rawData.property_type || '',
    estado: rawData.estado || rawData.status || rawData.state || 'Disponible',
    variacion: toNumber(rawData.variacion || rawData.variation || rawData.price_variation || 0),
    imagen: rawData.imagen || rawData.image || rawData.photo || rawData.main_image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80',
    coordenadas: {
      lat: toNumber(rawData.coordenadas?.lat || rawData.latitude || rawData.lat || 0),
      lng: toNumber(rawData.coordenadas?.lng || rawData.longitude || rawData.lng || 0)
    },
    descripcion: rawData.descripcion || rawData.description || '',
    amenidades: Array.isArray(rawData.amenidades || rawData.amenities || rawData.features) ?
      (rawData.amenidades || rawData.amenities || rawData.features) : [],
    fechaPublicacion: rawData.fechaPublicacion || rawData.publication_date || rawData.publishDate || new Date().toISOString().split('T')[0],
    roi: toNumber(rawData.roi || rawData.return_on_investment || 0)
  }
}

// Data transformation function for districts
function normalizeDistrict(rawData: any): DistrictMetrics {
  return {
    distrito: rawData.distrito || rawData.district || rawData.name || '',
    precioM2: toNumber(rawData.precioM2 || rawData.price_m2 || rawData.pricePerM2 || rawData.price_per_m2 || 0),
    propiedades: toNumber(rawData.propiedades || rawData.properties || rawData.property_count || rawData.num_properties || 0),
    variacion: toNumber(rawData.variacion || rawData.variation || rawData.price_variation || 0)
  }
}

// Helper to safely convert values to numbers
function toNumber(value: any): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

// Fetch all projects from CAPECO
async function fetchProjects(): Promise<CapecoProject[]> {
  try {
    // Using real data from nexoinmobiliario.pe scrape (realData.ts)
    // Each project already has the correct format
    const projects = realDataProjects || []
    console.log(`Loaded ${projects.length} projects from realData`)

    // Ensure all projects are normalized to CapecoProject interface
    return Array.isArray(projects) ? projects.map(normalizeProject) : []
  } catch (error) {
    console.error('Error loading CAPECO projects:', error)
    return []
  }
}

// Fetch metrics from CAPECO
async function fetchMetrics(): Promise<ApiMetrics> {
  try {
    // Calculate metrics from real data
    const projects = realDataProjects || []

    if (projects.length === 0) {
      return {
        totalProjects: 0,
        averagePriceM2: 0,
        monthlyVariation: 0,
        availableUnits: 0,
        totalVolume: '0'
      }
    }

    // Calculate average price per m²
    const totalPriceM2 = projects.reduce((sum, p) => sum + (p.precioM2 || 0), 0)
    const avgPriceM2 = Math.round(totalPriceM2 / projects.length)

    // Calculate average monthly variation
    const totalVariation = projects.reduce((sum, p) => sum + (p.variacion || 0), 0)
    const avgVariation = Math.round((totalVariation / projects.length) * 10) / 10

    // Calculate total volume (sum of all prices)
    const totalVolume = projects.reduce((sum, p) => sum + (p.precio || 0), 0)
    const totalVolumeStr = `S/. ${(totalVolume / 1000000).toFixed(1)}B`

    // Count available units
    const availableUnits = projects.filter(p => p.estado === 'Disponible').length

    return {
      totalProjects: projects.length,
      averagePriceM2: avgPriceM2,
      monthlyVariation: avgVariation,
      availableUnits: availableUnits,
      totalVolume: totalVolumeStr
    }
  } catch (error) {
    console.error('Error calculating CAPECO metrics:', error)
    return {
      totalProjects: 0,
      averagePriceM2: 0,
      monthlyVariation: 0,
      availableUnits: 0,
      totalVolume: '0'
    }
  }
}

// Fetch district metrics from CAPECO
async function fetchDistricts(): Promise<DistrictMetrics[]> {
  try {
    // Calculate district metrics from real data
    const projects = realDataProjects || []

    if (projects.length === 0) {
      return []
    }

    // Group projects by district
    const districtMap = new Map<string, CapecoProject[]>()
    projects.forEach(project => {
      const district = project.distrito || 'Unknown'
      if (!districtMap.has(district)) {
        districtMap.set(district, [])
      }
      districtMap.get(district)!.push(project)
    })

    // Calculate metrics for each district
    const districtMetrics: DistrictMetrics[] = Array.from(districtMap.entries()).map(([distrito, districtProjects]) => {
      const avgPriceM2 = Math.round(
        districtProjects.reduce((sum, p) => sum + (p.precioM2 || 0), 0) / districtProjects.length
      )
      const avgVariation = Math.round(
        (districtProjects.reduce((sum, p) => sum + (p.variacion || 0), 0) / districtProjects.length) * 10
      ) / 10

      return {
        distrito,
        precioM2: avgPriceM2,
        propiedades: districtProjects.length,
        variacion: avgVariation
      }
    })

    return districtMetrics
  } catch (error) {
    console.error('Error calculating CAPECO district metrics:', error)
    return []
  }
}

export const capecoApi = {
  fetchProjects,
  fetchMetrics,
  fetchDistricts,
}
