import { MessageCircle } from 'lucide-react'

const WHATSAPP_NUMBER = '5511999999999' // ← substitua pelo número real

interface Props {
  service: string
  contracted?: boolean // true = serviço ativo, false = serviço não contratado
}

export function ContactServiceBanner({ service, contracted = true }: Props) {
  const msg = contracted
    ? encodeURIComponent(`Olá! Tenho uma dúvida sobre o serviço de ${service} do meu projeto Bkoulf.`)
    : encodeURIComponent(`Olá! Tenho interesse em contratar o serviço de ${service} da Bkoulf. Podem me dar mais informações?`)

  if (contracted) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl">
        <div>
          <p className="text-white text-sm font-semibold">Tem dúvidas sobre {service}?</p>
          <p className="text-[rgba(176,184,196,0.6)] text-xs mt-0.5">Nossa equipe está pronta para te ajudar — resposta rápida pelo WhatsApp.</p>
        </div>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] text-[#5BAFF5] border border-[rgba(45,125,210,0.2)] hover:border-[rgba(255,255,255,0.08)] text-sm font-semibold transition-all shrink-0 whitespace-nowrap"
        >
          <MessageCircle className="w-4 h-4" />
          Falar com a equipe
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl">
      <div>
        <p className="text-white text-sm font-semibold">Quer adicionar {service} ao seu plano?</p>
        <p className="text-[rgba(176,184,196,0.6)] text-xs mt-0.5">Este serviço não está no seu plano atual. Entre em contato para saber mais.</p>
      </div>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] text-[#2D7DD2] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)] text-sm font-semibold transition-all shrink-0 whitespace-nowrap"
      >
        <MessageCircle className="w-4 h-4" />
        Tenho interesse
      </a>
    </div>
  )
}
