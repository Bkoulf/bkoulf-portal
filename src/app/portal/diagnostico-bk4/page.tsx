import { Zap, Palette, Video, Globe, TrendingUp, ArrowRight, MessageCircle, ShieldCheck, TrendingUp as Growth } from 'lucide-react'
import { ContactServiceBanner } from '@/components/portal/contact-service-banner'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Método BK4',
}


const WHATSAPP_NUMBER = '5511999999999'
const WHATSAPP_MESSAGE = encodeURIComponent('Olá! Quero saber mais sobre o Método BK4 e como ele pode transformar minha presença digital.')

const etapas = [
  {
    numero: '01',
    label: 'Identidade Visual',
    icon: Palette,
    descricao: 'Marca profissional que gera confiança e te diferencia da concorrência desde o primeiro olhar.',
  },
  {
    numero: '02',
    label: 'Audiovisual',
    icon: Video,
    descricao: 'Conteúdo em vídeo que engaja, convence e mantém sua marca na cabeça do cliente.',
  },
  {
    numero: '03',
    label: 'Presença Digital',
    icon: Globe,
    descricao: 'Site de alta conversão que transforma visitantes em contatos e contatos em clientes.',
  },
  {
    numero: '04',
    label: 'Conversão e Tráfego',
    icon: TrendingUp,
    descricao: 'Anúncios pagos que colocam sua empresa na frente de quem já está pronto para comprar.',
  },
]

const garantias = [
  'Presença digital completa — do zero ao cliente',
  'Marca consistente em todos os canais',
  'Mais leads qualificados com menor custo',
  'Crescimento mensurável com relatórios mensais',
]

export default function MetodoBK4Page() {
  return (
    <div className="space-y-5 pb-6">

      {/* Hero */}
      <div
        className="rounded-2xl p-8 sm:p-10 relative overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div
          className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,168,67,0.06), transparent 70%)', filter: 'blur(40px)' }}
        />
        <div className="relative flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <Zap className="w-5 h-5 text-[#D4A843]" />
            </div>
            <span className="text-[#D4A843] text-xs font-bold tracking-[3px] uppercase">Metodologia proprietária</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-2">
            O método que garante o<br />
            <span className="text-[#D4A843]">crescimento da sua empresa.</span>
          </h1>
          <p className="text-[#B0B8C4] text-base leading-relaxed mb-6 max-w-xl">
            O BK4 é um sistema completo de 4 etapas desenvolvido para empresas que querem sair da invisibilidade e começar a atrair clientes de forma consistente.
          </p>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: '#D4A843', color: '#050A14', boxShadow: '0 0 24px rgba(212,168,67,0.25)' }}
          >
            <MessageCircle className="w-4 h-4" />
            Quero crescer com o BK4
          </a>
        </div>
      </div>

      {/* Garantia destaque */}
      <div
        className="rounded-xl px-6 py-4 flex items-center gap-4"
        style={{ background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.15)' }}
      >
        <ShieldCheck className="w-5 h-5 text-[#D4A843] shrink-0" />
        <p className="text-white text-sm font-medium">
          Empresas que aplicam o Método BK4 constroem autoridade de marca, atraem mais clientes e crescem de forma previsível.
        </p>
      </div>

      {/* 4 Etapas */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-bold text-white">Como funciona</h2>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {etapas.map((etapa) => {
            const Icon = etapa.icon
            return (
              <div
                key={etapa.numero}
                className="rounded-xl p-5 relative overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span
                  className="absolute top-3 right-4 text-6xl font-black select-none leading-none"
                  style={{ color: 'rgba(255,255,255,0.03)' }}
                >
                  {etapa.numero}
                </span>
                <div className="relative flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(212,168,67,0.1)' }}
                  >
                    <Icon className="w-[18px] h-[18px] text-[#D4A843]" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">{etapa.label}</p>
                    <p className="text-[#B0B8C4] text-xs leading-relaxed">{etapa.descricao}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Fluxo */}
        <div
          className="mt-2 rounded-xl px-5 py-3 flex flex-wrap items-center gap-2"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          {etapas.map((e, i) => (
            <div key={e.numero} className="flex items-center gap-2">
              <span className="text-xs text-[#B0B8C4]">{e.label}</span>
              {i < etapas.length - 1 && <ArrowRight className="w-3 h-3 text-[rgba(176,184,196,0.25)]" />}
            </div>
          ))}
          <span className="ml-auto text-xs font-bold text-[#D4A843]">= Crescimento garantido</span>
        </div>
      </section>

      {/* O que você garante */}
      <section
        className="rounded-xl p-6"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <h2 className="text-base font-bold text-white mb-4">O que sua empresa garante ao contratar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {garantias.map((g, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.3)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A843]" />
              </div>
              <span className="text-[#B0B8C4] text-sm leading-relaxed">{g}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <div
        className="rounded-2xl p-8 text-center relative overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(212,168,67,0.07), transparent 65%)' }}
        />
        <div className="relative">
          <p className="text-[#D4A843] text-xs font-bold tracking-[3px] uppercase mb-3">Próximo passo</p>
          <h3 className="text-white font-black text-xl sm:text-2xl mb-2 leading-tight">
            Sua empresa pode ser a próxima<br />a crescer com o BK4.
          </h3>
          <p className="text-[#B0B8C4] text-sm mb-6 max-w-xs mx-auto leading-relaxed">
            Fale agora com a equipe e descubra qual etapa sua empresa precisa começar.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: '#D4A843', color: '#050A14', boxShadow: '0 0 28px rgba(212,168,67,0.2)' }}
          >
            <MessageCircle className="w-4 h-4" />
            Quero crescer agora
          </a>
        </div>
      </div>

      <ContactServiceBanner service="Método BK4" />

    </div>
  )
}
