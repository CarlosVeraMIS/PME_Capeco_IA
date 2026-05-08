# CAPECO Data Lake Integration

## Overview
The Monitor dashboard is now integrated with the CAPECO Data Lake API as its primary data source. This provides real-time access to 9,319 certified real estate projects across Lima with comprehensive market analytics.

## Architecture

### API Service Layer
**File:** `src/services/capecoApi.ts`

The API service provides typed interfaces for:
- `fetchProjects()` - Get all certified projects (9,319 records)
- `fetchMetrics()` - Retrieve aggregated market metrics
- `fetchDistricts()` - Get district-level analytics for 20 Lima districts

### Data Transformation Layer
**File:** `src/data/capecoData.ts`

Transforms raw CAPECO API data into the dashboard format with:
- Real-time market statistics (average price/m², total projects, available units)
- 7-month trend analysis for price movements
- District rankings by price per square meter
- Property listings with full details (ROI, amenities, coordinates)

### Connected Pages

#### Desktop Dashboard
**File:** `src/pages/desktop/DashboardDesktop.tsx`
- Displays live statistics cards with CAPECO metrics
- Shows market trends from 7-month historical data
- Lists top 5 districts by price/m²
- Displays 4 most recent projects

#### Mobile Dashboard
**File:** `src/pages/mobile/Dashboard.tsx`
- Responsive market overview with key metrics
- Trend chart for price/m² movement
- Top active district indicator
- Recent properties carousel

## API Endpoints

**Base URL:** `https://pme-capeco-api.azurewebsites.net/api/v1/gold`

### Available Endpoints

1. **GET /projects**
   - Returns: Array of 9,319 certified projects
   - Fields: id, titulo, distrito, precio, precioM2, area, dormitorios, banos, tipo, estado, variacion, imagen, coordenadas, descripcion, amenidades, fechaPublicacion, roi

2. **GET /metrics**
   - Returns: Aggregated market metrics
   - Fields: totalProjects, averagePriceM2, monthlyVariation, availableUnits, totalVolume

3. **GET /districts**
   - Returns: Analytics for 20 Lima districts
   - Fields: distrito, precioM2, proyectos, variacion

## Data Flow

```
CAPECO Data Lake (Azure)
         ↓
REST API (pme-capeco-api.azurewebsites.net)
         ↓
capecoApi Service (src/services/capecoApi.ts)
         ↓
capecoData Transform (src/data/capecoData.ts)
         ↓
Dashboard Pages (DashboardDesktop.tsx, Dashboard.tsx)
         ↓
User Interface
```

## Error Handling

All API calls include fallback to static data if the service is unavailable:
- Network errors default to sample data
- Partial failures use mixed live + cached data
- User is not blocked by API latency

## Performance

- API calls are async/await with proper loading states
- Data fetches parallel: projects + metrics + districts simultaneously
- Caching via fallback mechanism reduces repeated API calls
- Pagination support for projects list

## Integration Checklist

- [x] Create API service client
- [x] Create data transformation layer
- [x] Update DashboardDesktop component with live data
- [x] Update mobile Dashboard component with live data
- [x] Add state management (useState, useEffect)
- [x] Implement error handling with fallbacks
- [ ] Test in production (Vercel deployment)
- [ ] Monitor API performance metrics
- [ ] Update other pages using realData.ts (Busqueda, Mapa, Analisis, etc.)

## Next Steps

1. Commit and push changes to GitHub
2. Vercel automatically deploys the updated dashboard
3. Monitor performs live API calls to CAPECO endpoints
4. User sees 9,319 real certified projects instead of 312 mock projects

## Data Accuracy

- **Source:** CAPECO Data Lake (Bronze → Silver → Gold layers)
- **Records:** 9,319 certified projects across Lima
- **Districts:** 20 Lima metropolitan districts
- **Last Updated:** 2026-05-08
- **Data Freshness:** Real-time from Azure storage via FastAPI

## Contact

For issues with CAPECO API integration, check:
- API server status: https://pme-capeco-api.azurewebsites.net/health
- Azure App Service logs
- GitHub commit: Integration commits to Monitor project
