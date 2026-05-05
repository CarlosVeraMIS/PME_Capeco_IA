// Approximate polygon boundaries for Lima districts used in map choropleth layers.
// Simplified shapes — good enough for choropleth visualization.

type GeoFeature = {
  type: 'Feature'
  properties: { nombre: string }
  geometry: { type: 'Polygon'; coordinates: [number, number][][] }
}

export type DistritosGeoJSON = {
  type: 'FeatureCollection'
  features: GeoFeature[]
}

function rect(w: number, e: number, n: number, s: number, nombre: string): GeoFeature {
  return {
    type: 'Feature',
    properties: { nombre },
    geometry: {
      type: 'Polygon',
      coordinates: [[[w, n], [e, n], [e, s], [w, s], [w, n]]],
    },
  }
}

export const limaDistritosGeo: DistritosGeoJSON = {
  type: 'FeatureCollection',
  features: [
    rect(-77.088, -77.058, -12.074, -12.100, 'Magdalena Del Mar'),
    rect(-77.115, -77.073, -12.053, -12.090, 'San Miguel'),
    rect(-77.086, -77.058, -12.062, -12.090, 'Pueblo Libre'),
    rect(-77.070, -77.047, -12.040, -12.068, 'Breña'),
    rect(-77.068, -77.028, -12.073, -12.113, 'San Isidro'),
    rect(-77.066, -77.040, -12.055, -12.079, 'Jesus Maria'),
    rect(-77.060, -77.018, -12.028, -12.070, 'Cercado de lima'),
    rect(-77.048, -77.015, -12.018, -12.055, 'Rimac'),
    rect(-77.048, -77.022, -12.067, -12.090, 'Lince'),
    rect(-77.048, -77.016, -12.099, -12.135, 'Miraflores'),
    rect(-77.040, -77.006, -12.136, -12.165, 'Barranco'),
    rect(-77.030, -76.998, -12.045, -12.080, 'La Victoria'),
    rect(-77.028, -76.997, -12.098, -12.122, 'Surquillo'),
    rect(-77.022, -76.983, -12.085, -12.125, 'San Borja'),
    rect(-77.043, -76.987, -12.136, -12.200, 'Chorrillos'),
    rect(-77.030, -76.960, -12.110, -12.200, 'Santiago De Surco'),
    rect(-77.002, -76.977, -12.066, -12.094, 'San Luis'),
    rect(-76.978, -76.877, -12.048, -12.118, 'La Molina'),
    rect(-77.095, -77.040, -11.945, -12.000, 'Los Olivos'),
    rect(-77.075, -76.998, -11.910, -11.960, 'Comas'),
  ],
}
