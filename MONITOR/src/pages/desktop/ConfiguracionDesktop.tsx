import { useState } from 'react'
import { Bell, User, Shield, Palette, Database, ChevronRight } from 'lucide-react'

const seccionesMenu = [
  { id: 'perfil', icon: User, label: 'Perfil de Usuario' },
  { id: 'notificaciones', icon: Bell, label: 'Notificaciones' },
  { id: 'apariencia', icon: Palette, label: 'Apariencia' },
  { id: 'seguridad', icon: Shield, label: 'Seguridad' },
  { id: 'datos', icon: Database, label: 'Datos y Privacidad' },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#26B7FF]' : 'bg-[rgba(255,255,255,0.1)]'}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

export function ConfiguracionDesktop() {
  const [seccionActiva, setSeccionActiva] = useState('perfil')
  const [notifs, setNotifs] = useState({ precios: true, nuevas: true, mercado: false, email: true })
  const [tema, setTema] = useState('dark')

  return (
    <div className="flex h-full overflow-hidden p-5 gap-5">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 glass rounded-xl p-3 flex flex-col gap-1">
        <p className="text-xs font-semibold text-[#26B7FF] uppercase tracking-wider px-3 py-2">Configuración</p>
        {seccionesMenu.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setSeccionActiva(id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
              seccionActiva === id
                ? 'bg-[rgba(38,183,255,0.12)] text-[#26B7FF] border border-[rgba(38,183,255,0.2)]'
                : 'text-[#c2c6d3] hover:bg-white/5'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </aside>

      {/* Content */}
      <div className="flex-1 glass rounded-xl p-6 overflow-y-auto">
        {seccionActiva === 'perfil' && (
          <div>
            <h2 className="text-lg font-bold text-[#d8e2ff] mb-5">Perfil de Usuario</h2>
            <div className="flex items-center gap-4 mb-6 glass rounded-xl p-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0058a7] to-[#26B7FF] flex items-center justify-center">
                <User size={28} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-[#d8e2ff]">Carlos Vera</p>
                <p className="text-sm text-[#8c919d]">carlos.vera@capeco.pe</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(38,183,255,0.1)] text-[#26B7FF] border border-[rgba(38,183,255,0.25)] mt-1 inline-block">Inversor PRO</span>
              </div>
              <button className="ml-auto px-4 py-2 rounded-lg glass border border-[rgba(38,183,255,0.3)] text-[#26B7FF] text-sm font-semibold">
                Editar foto
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Nombre completo', value: 'Carlos Vera' },
                { label: 'Email', value: 'carlos.vera@capeco.pe' },
                { label: 'Teléfono', value: '+51 999 888 777' },
                { label: 'Organización', value: 'CAPECO' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-[#8c919d] mb-1">{label}</p>
                  <input
                    defaultValue={value}
                    className="w-full glass rounded-lg px-4 py-2.5 text-sm text-[#d8e2ff] bg-transparent outline-none border border-transparent focus:border-[rgba(38,183,255,0.3)]"
                  />
                </div>
              ))}
            </div>
            <button className="mt-5 px-6 py-2.5 rounded-lg bg-[#26B7FF] text-[#03132d] text-sm font-bold">
              Guardar cambios
            </button>
          </div>
        )}

        {seccionActiva === 'notificaciones' && (
          <div>
            <h2 className="text-lg font-bold text-[#d8e2ff] mb-5">Notificaciones</h2>
            <div className="flex flex-col gap-3">
              {[
                { key: 'precios' as const, label: 'Alertas de precio', desc: 'Notificar cuando un precio baje más de un umbral definido' },
                { key: 'nuevas' as const, label: 'Nuevas propiedades', desc: 'Avisar cuando entren propiedades en mis zonas favoritas' },
                { key: 'mercado' as const, label: 'Resumen de mercado', desc: 'Informe semanal con tendencias del mercado limeño' },
                { key: 'email' as const, label: 'Notificaciones por email', desc: 'Recibir alertas también en carlos.vera@capeco.pe' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="glass rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#d8e2ff]">{label}</p>
                    <p className="text-xs text-[#8c919d]">{desc}</p>
                  </div>
                  <Toggle checked={notifs[key]} onChange={v => setNotifs(p => ({ ...p, [key]: v }))} />
                </div>
              ))}
            </div>
          </div>
        )}

        {seccionActiva === 'apariencia' && (
          <div>
            <h2 className="text-lg font-bold text-[#d8e2ff] mb-5">Apariencia</h2>
            <p className="text-xs text-[#8c919d] mb-3">Tema de color</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'dark', label: 'Celestial Dark', colors: ['#03132d', '#26B7FF', '#2fe0a2'] },
                { id: 'midnight', label: 'Midnight Blue', colors: ['#000814', '#4361ee', '#7209b7'] },
                { id: 'ocean', label: 'Deep Ocean', colors: ['#03045e', '#0096c7', '#48cae4'] },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTema(t.id)}
                  className={`glass rounded-xl p-4 text-left transition-all ${
                    tema === t.id ? 'border border-[rgba(38,183,255,0.4)]' : 'border border-transparent'
                  }`}
                >
                  <div className="flex gap-1.5 mb-3">
                    {t.colors.map(c => (
                      <div key={c} className="w-5 h-5 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-[#d8e2ff]">{t.label}</p>
                  {tema === t.id && <p className="text-[10px] text-[#26B7FF] mt-0.5">Activo</p>}
                </button>
              ))}
            </div>
          </div>
        )}

        {(seccionActiva === 'seguridad' || seccionActiva === 'datos') && (
          <div>
            <h2 className="text-lg font-bold text-[#d8e2ff] mb-5">
              {seccionActiva === 'seguridad' ? 'Seguridad' : 'Datos y Privacidad'}
            </h2>
            <div className="flex flex-col gap-2">
              {[
                'Cambiar contraseña',
                'Autenticación en dos pasos',
                'Sesiones activas',
                seccionActiva === 'datos' ? 'Exportar mis datos' : 'Historial de accesos',
                seccionActiva === 'datos' ? 'Eliminar cuenta' : 'Cerrar todas las sesiones',
              ].map(item => (
                <button key={item} className="glass glass-hover rounded-xl px-5 py-3.5 flex items-center justify-between text-left transition-all">
                  <span className="text-sm text-[#d8e2ff]">{item}</span>
                  <ChevronRight size={16} className="text-[#424751]" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
