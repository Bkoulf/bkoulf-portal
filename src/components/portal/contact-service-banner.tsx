import { MessageCircle } from 'lucide-react'

const WHATSAPP_NUMBER = '5511999999999' // ← substitua pelo número real

interface Props {
  service: string
  contracted?: boolean
}

export function ContactServiceBanner({ service, contracted = true }: Props) {
  const msg = contracted
    ? encodeURIComponent(`Olá! Tenho uma dúvida sobre o serviço de ${service} do meu projeto Bkoulf.`)
    : encodeURIComponent(`Olá! Tenho interesse em contratar o serviço de ${service} da Bkoulf. Podem me dar mais informações?`)

  if (contracted) {
    return (
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl"
        style={{
          background: 'rgba(45,125,210,0.06)',
          border: '1px solid rgba(45,125,210,0.15)',
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(45,125,210,0.12)' }}
          >
            <MessageCircle className="w-4 h-4 text-[#2D7DD2]" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Dúvidas sobre {service}?</p>
            <p className="text-[rgba(176,184,196,0.6)] text-xs mt-0.5 leading-relaxed">
              Nossa equipe responde rápido pelo WhatsApp — tire qualquer dúvida.
            </p>
          </div>
        </div>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 whitespace-nowrap hover:opacity-90 active:scale-95"
          style={{
            background: 'rgba(45,125,210,0.15)',
            color: '#7DC4FF',
            border: '1px solid rgba(45,125,210,0.25)',
          }}
        >
          <MessageCircle className="w-4 h-4" />
          Chamar no WhatsApp
        </a>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl"
      style={{
        background: 'rgba(45,125,210,0.06)',
        border: '1px solid rgba(45,125,210,0.15)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(45,125,210,0.12)' }}
        >
          <MessageCircle className="w-4 h-4 text-[#2D7DD2]" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold">Quer adicionar {service} ao seu plano?</p>
          <p className="text-[rgba(176,184,196,0.6)] text-xs mt-0.5 leading-relaxed">
            Este serviço não está no seu plano atual. Fale com a equipe para saber mais.
          </p>
        </div>
      </div>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 whitespace-nowrap hover:opacity-90 active:scale-95"
        style={{
          background: 'rgba(45,125,210,0.15)',
          color: '#7DC4FF',
          border: '1px solid rgba(45,125,210,0.25)',
        }}
      >
        <MessageCircle className="w-4 h-4" />
        Tenho interesse
      </a>
    </div>
  )
}
