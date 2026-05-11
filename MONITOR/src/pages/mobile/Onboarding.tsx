import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, MapPin, Bell, ChevronRight } from 'lucide-react'

const slides = [
  {
    icon: TrendingUp,
    color: '#26B7FF',
    title: 'Inteligencia de Mercado',
    desc: 'Analiza precios/m², tendencias y variaciones en tiempo real para todos los distritos de Lima.',
  },
  {
    icon: MapPin,
    color: '#2fe0a2',
    title: 'Mapa de Calor IA',
    desc: 'Visualiza geoespacialmente dónde está el valor inmobiliario y descubre zonas emergentes.',
  },
  {
    icon: Bell,
    color: '#a7c8ff',
    title: 'Alertas Inteligentes',
    desc: 'Recibe notificaciones cuando una propiedad baja de precio o surge una oportunidad de inversión.',
  },
]

export function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const siguiente = () => {
    if (step < slides.length - 1) setStep(s => s + 1)
    else navigate('/')
  }

  const { icon: Icon, color, title, desc } = slides[step]

  return (
    <div className="min-h-screen bg-[#03132d] flex flex-col">
      {/* Skip */}
      <div className="px-4 pt-12 flex justify-end">
        <button onClick={() => navigate('/')} className="text-xs text-[#8c919d]">Saltar</button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Icon blob */}
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center mb-8"
          style={{ background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`, border: `1px solid ${color}33` }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: `${color}15` }}
          >
            <Icon size={36} style={{ color }} />
          </div>
        </div>

        {/* Logo */}
        <div className="mb-2">
          <p className="text-xs font-semibold tracking-widest text-[#8c919d] uppercase mb-1">Monitor</p>
          <p className="text-xs" style={{ color }}>Real Estate IA</p>
        </div>

        <h2 className="text-2xl font-bold text-[#d8e2ff] mb-4 leading-tight">{title}</h2>
        <p className="text-sm text-[#c2c6d3] leading-relaxed">{desc}</p>
      </div>

      {/* Footer */}
      <div className="px-8 pb-12">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="rounded-full transition-all"
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                background: i === step ? '#26B7FF' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>

        <button
          onClick={siguiente}
          className="w-full py-4 rounded-xl font-bold text-[#03132d] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{ background: step === slides.length - 1 ? '#2fe0a2' : '#26B7FF' }}
        >
          {step === slides.length - 1 ? 'Comenzar' : 'Siguiente'}
          <ChevronRight size={18} />
        </button>

        <button onClick={() => navigate('/')} className="w-full mt-3 py-3 text-sm text-[#8c919d]">
          Ya tengo cuenta — Iniciar sesión
        </button>
      </div>
    </div>
  )
}
