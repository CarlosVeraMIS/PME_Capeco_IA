import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Search, MapPin, Bell, User,
  TrendingUp, Calculator, Heart, BarChart3, Settings, Bot,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/monitor', icon: Bot, label: 'Monitor IA' },
  { to: '/busqueda', icon: Search, label: 'Búsqueda' },
  { to: '/mapa', icon: MapPin, label: 'Mapa' },
  { to: '/analisis', icon: TrendingUp, label: 'Análisis' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/alertas', icon: Bell, label: 'Alertas' },
  { to: '/favoritos', icon: Heart, label: 'Favoritos' },
  { to: '/calculadora', icon: Calculator, label: 'Calculadora' },
  { to: '/configuracion', icon: Settings, label: 'Configuración' },
  { to: '/perfil', icon: User, label: 'Perfil' },
]

export function DesktopSidebar() {
  return (
    <aside className="w-56 shrink-0 glass border-r border-white/10 flex flex-col h-full">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0058a7] flex items-center justify-center">
            <span className="text-[#26B7FF] font-bold text-xs">M</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#d8e2ff]">MONITOR</p>
            <p className="text-[10px] text-[#26B7FF]">Real Estate IA</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[rgba(38,183,255,0.12)] text-[#26B7FF] border border-[rgba(38,183,255,0.2)]'
                  : 'text-[#c2c6d3] hover:bg-white/5 hover:text-[#d8e2ff]'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="glass rounded-lg p-3">
          <p className="text-[10px] text-[#8c919d] mb-1">Lima, Perú</p>
          <p className="text-xs text-[#2fe0a2] font-semibold">Mercado activo ●</p>
        </div>
      </div>
    </aside>
  )
}
