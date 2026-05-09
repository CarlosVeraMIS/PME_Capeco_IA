// CAPECO Data Lake API Service
// Integrates with: https://pme-capeco-api.azurewebsites.net

const API_BASE_URL = 'https://pme-capeco-api.azurewebsites.net/api/v1/gold'

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

// Fetch all projects from CAPECO
async function fetchProjects(): Promise<CapecoProject[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects`)
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching CAPECO projects:', error)
    return []
  }
}

// Fetch metrics from CAPECO
async function fetchMetrics(): Promise<ApiMetrics> {
  try {
    const response = await fetch(`${API_BASE_URL}/metrics`)
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    const data = await response.json()
    return data.data || {}
  } catch (error) {
    console.error('Error fetching CAPECO metrics:', error)
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
    const response = await fetch(`${API_BASE_URL}/districts`)
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching CAPECO districts:', error)
    return []
  }
}

export const capecoApi = {
  fetchProjects,
  fetchMetrics,
  fetchDistricts,
}
