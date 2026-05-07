import clsx from 'clsx'

type BadgeVariant = 'disponible' | 'negociacion' | 'vendido' | 'alerta' | 'info' | 'success'

const variantStyles: Record<BadgeVariant, string> = {
  disponible: 'bg-[rgba(47,224,162,0.12)] text-[#2fe0a2] border border-[rgba(47,224,162,0.3)]',
  negociacion: 'bg-[rgba(167,200,255,0.12)] text-[#a7c8ff] border border-[rgba(167,200,255,0.3)]',
  vendido: 'bg-[rgba(255,255,255,0.08)] text-[#8c919d] border border-[rgba(255,255,255,0.15)]',
  alerta: 'bg-[rgba(255,180,171,0.12)] text-[#ffb4ab] border border-[rgba(255,180,171,0.3)]',
  info: 'bg-[rgba(38,183,255,0.12)] text-[#26B7FF] border border-[rgba(38,183,255,0.3)]',
  success: 'bg-[rgba(47,224,162,0.12)] text-[#2fe0a2] border border-[rgba(47,224,162,0.3)]',
}

const estadoToVariant: Record<string, BadgeVariant> = {
  'Disponible': 'disponible',
  'En negociación': 'negociacion',
  'Vendido': 'vendido',
}

interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

export function Badge({ label, variant }: BadgeProps) {
  const v = variant ?? estadoToVariant[label] ?? 'info'
  return (
    <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full', variantStyles[v])}>
      {label}
    </span>
  )
}
