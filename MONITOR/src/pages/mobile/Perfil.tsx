import { useNavigate } from 'react-router-dom'
import { User, Bell, Shield, HelpCircle, LogOut, ChevronRight, TrendingUp, Heart, Search } from 'lucide-react'

const menuItems = [
  { icon: Bell, label: 'Notificaciones', sub: '4 alertas activas', to: '/alertas' },
  { icon: Heart, label: 'Mis Favoritos', sub: '3 propiedades guardadas', to: '/favoritos' },
  { icon: Search, label: 'Búsquedas guardadas', sub: '2 búsquedas', to: '/busqueda' },
  { icon: TrendingUp, label: 'Análisis de Mercado', sub: 'Lima — actualizado hoy', to: '/analisis' },
  { icon: Shield, label: 'Privacidad y Seguridad', sub: '' },
  { icon: HelpCircle, label: 'Ayuda y Soporte', sub: '' },
]

export function Perfil() {
  const navigate = useNavigate()

  return (
    <div className="pb-24 min-h-screen bg-[#03132d]">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-[#d8e2ff] mb-6">Perfil</h1>

        {/* Avatar card */}
        <div className="glass rounded-xl p-5 mb-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0058a7] to-[#26B7FF] flex items-center justify-center shrink-0">
            <User size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-[#d8e2ff]">Carlos Vera</p>
            <p className="text-xs text-[#8c919d]">carlos.vera@capeco.pe</p>
            <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-[rgba(38,183,255,0.12)] text-[#26B7FF] border border-[rgba(38,183,255,0.25)]">
              Inversor PRO
            </span>
          </div>
          <button className="text-xs text-[#a7c8ff]">Editar</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Favoritos', value: '3' },
            { label: 'Alertas', value: '4' },
            { label: 'Búsquedas', value: '2' },
          ].map(({ label, value }) => (
            <div key={label} className="glass rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-[#26B7FF]">{value}</p>
              <p className="text-[10px] text-[#8c919d]">{label}</p>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="flex flex-col gap-2">
          {menuItems.map(({ icon: Icon, label, sub, to }) => (
            <button
              key={label}
              onClick={() => to && navigate(to)}
              className="glass glass-hover rounded-xl p-4 flex items-center gap-3 w-full text-left transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-[rgba(38,183,255,0.08)] flex items-center justify-center shrink-0">
                <Icon size={16} className="text-[#26B7FF]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#d8e2ff]">{label}</p>
                {sub && <p className="text-xs text-[#8c919d]">{sub}</p>}
              </div>
              <ChevronRight size={16} className="text-[#424751] shrink-0" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button className="w-full mt-4 py-3 rounded-xl glass border border-[rgba(255,180,171,0.2)] text-[#ffb4ab] text-sm font-semibold flex items-center justify-center gap-2">
          <LogOut size={16} />
          Cerrar sesión
        </button>

        {/* Version */}
        <p className="text-center text-[10px] text-[#424751] mt-4">Monitor RE IA v0.1.0 — Lima, Perú</p>
      </div>
    </div>
  )
}
