import { User, Heart, Bell, Search, TrendingUp, Shield, HelpCircle, LogOut, ChevronRight } from 'lucide-react'

const stats = [
  { label: 'Favoritos', value: '12' },
  { label: 'Alertas activas', value: '4' },
  { label: 'Búsquedas guardadas', value: '7' },
]

const menuItems = [
  { icon: TrendingUp, label: 'Mi actividad de inversión' },
  { icon: Bell, label: 'Gestión de alertas' },
  { icon: Heart, label: 'Propiedades favoritas' },
  { icon: Search, label: 'Búsquedas guardadas' },
  { icon: Shield, label: 'Seguridad y privacidad' },
  { icon: HelpCircle, label: 'Ayuda y soporte' },
]

export function PerfilDesktop() {
  return (
    <div className="p-6 overflow-y-auto h-full flex flex-col gap-5 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#d8e2ff]">Perfil</h1>

      {/* Avatar card */}
      <div className="glass rounded-xl p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0058a7] to-[#26B7FF] flex items-center justify-center shrink-0">
          <User size={36} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xl font-bold text-[#d8e2ff]">Carlos Vera</p>
          <p className="text-sm text-[#8c919d]">carlos.vera@capeco.pe</p>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[rgba(38,183,255,0.1)] text-[#26B7FF] border border-[rgba(38,183,255,0.25)] mt-2 inline-block">
            Inversor PRO
          </span>
        </div>
        <button className="glass px-4 py-2 rounded-lg border border-[rgba(38,183,255,0.3)] text-[#26B7FF] text-sm font-semibold">
          Editar perfil
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="glass rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-[#26B7FF]">{value}</p>
            <p className="text-xs text-[#8c919d] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="glass rounded-xl overflow-hidden">
        {menuItems.map(({ icon: Icon, label }, i) => (
          <button
            key={label}
            className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-all text-left ${
              i > 0 ? 'border-t border-white/5' : ''
            }`}
          >
            <Icon size={16} className="text-[#26B7FF] shrink-0" />
            <span className="flex-1 text-sm text-[#d8e2ff]">{label}</span>
            <ChevronRight size={15} className="text-[#424751]" />
          </button>
        ))}
      </div>

      <button className="flex items-center justify-center gap-2 glass rounded-xl py-3.5 text-sm font-semibold text-[#ffb4ab] border border-[rgba(255,180,171,0.2)] hover:bg-[rgba(255,180,171,0.05)] transition-all">
        <LogOut size={15} /> Cerrar sesión
      </button>
    </div>
  )
}
