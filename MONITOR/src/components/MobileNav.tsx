import { NavLink } from 'react-router-dom'
import { Home, Search, MapPin, Bot, User } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/busqueda', icon: Search, label: 'Buscar' },
  { to: '/mapa', icon: MapPin, label: 'Mapa' },
  { to: '/monitor', icon: Bot, label: 'Monitor IA' },
  { to: '/perfil', icon: User, label: 'Perfil' },
]

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                isActive
                  ? 'text-[#26B7FF]'
                  : 'text-[#8c919d] hover:text-[#c2c6d3]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-semibold">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
