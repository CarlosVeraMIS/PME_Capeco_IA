import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom'
import { useIsMobile } from './hooks/useIsMobile'
import { MobileNav } from './components/MobileNav'
import { DesktopSidebar } from './components/DesktopSidebar'

// Mobile pages
import { Dashboard } from './pages/mobile/Dashboard'
import { Busqueda } from './pages/mobile/Busqueda'
import { DetallePropiedad } from './pages/mobile/DetallePropiedad'
import { Mapa } from './pages/mobile/Mapa'
import { Alertas } from './pages/mobile/Alertas'
import { Perfil } from './pages/mobile/Perfil'
import { Calculadora } from './pages/mobile/Calculadora'
import { Favoritos } from './pages/mobile/Favoritos'
import { AnalisisMercado } from './pages/mobile/AnalisisMercado'
import { Comparador } from './pages/mobile/Comparador'
import { Onboarding } from './pages/mobile/Onboarding'
import { MonitorIA } from './pages/mobile/MonitorIA'

// Desktop pages
import { DashboardDesktop } from './pages/desktop/DashboardDesktop'
import { BusquedaDesktop } from './pages/desktop/BusquedaDesktop'
import { DetallePropDesktop } from './pages/desktop/DetallePropDesktop'
import { MapaDesktop } from './pages/desktop/MapaDesktop'
import { AnalisisDesktop } from './pages/desktop/AnalisisDesktop'
import { AnalyticsDesktop } from './pages/desktop/AnalyticsDesktop'
import { AlertasDesktop } from './pages/desktop/AlertasDesktop'
import { FavoritosDesktop } from './pages/desktop/FavoritosDesktop'
import { CalculadoraDesktop } from './pages/desktop/CalculadoraDesktop'
import { ConfiguracionDesktop } from './pages/desktop/ConfiguracionDesktop'
import { PerfilDesktop } from './pages/desktop/PerfilDesktop'
import { MonitorIADesktop } from './pages/desktop/MonitorIADesktop'

function AppLayout() {
  const isMobile = useIsMobile()

  return isMobile ? (
    <div className="flex flex-col h-screen bg-[#03132d] overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
      <MobileNav />
    </div>
  ) : (
    <div className="flex h-screen bg-[#03132d] overflow-hidden">
      <DesktopSidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}

function Page({ mobile, desktop }: { mobile: React.ReactNode; desktop: React.ReactNode }) {
  const isMobile = useIsMobile()
  return <>{isMobile ? mobile : desktop}</>
}

function DesktopPathRedirect() {
  const { '*': rest } = useParams()
  return <Navigate to={`/${rest ?? ''}`} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Page mobile={<Dashboard />} desktop={<DashboardDesktop />} />} />
          <Route path="/busqueda" element={<Page mobile={<Busqueda />} desktop={<BusquedaDesktop />} />} />
          <Route path="/propiedad/:id" element={<Page mobile={<DetallePropiedad />} desktop={<DetallePropDesktop />} />} />
          <Route path="/mapa" element={<Page mobile={<Mapa />} desktop={<MapaDesktop />} />} />
          <Route path="/alertas" element={<Page mobile={<Alertas />} desktop={<AlertasDesktop />} />} />
          <Route path="/perfil" element={<Page mobile={<Perfil />} desktop={<PerfilDesktop />} />} />
          <Route path="/calculadora" element={<Page mobile={<Calculadora />} desktop={<CalculadoraDesktop />} />} />
          <Route path="/favoritos" element={<Page mobile={<Favoritos />} desktop={<FavoritosDesktop />} />} />
          <Route path="/analisis" element={<Page mobile={<AnalisisMercado />} desktop={<AnalisisDesktop />} />} />
          <Route path="/analytics" element={<AnalyticsDesktop />} />
          <Route path="/monitor" element={<Page mobile={<MonitorIA />} desktop={<MonitorIADesktop />} />} />
          <Route path="/comparador" element={<Comparador />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/configuracion" element={<ConfiguracionDesktop />} />
        </Route>

        {/* Legacy /desktop/* redirects to unified paths */}
        <Route path="/desktop" element={<Navigate to="/" replace />} />
        <Route path="/desktop/*" element={<DesktopPathRedirect />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
