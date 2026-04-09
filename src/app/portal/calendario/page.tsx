import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, CalendarX } from 'lucide-react'

const typeConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  reuniao:    { label: 'Reunião',    color: 'text-[#2D7DD2]', bg: 'bg-[rgba(45,125,210,0.1)] border-[rgba(45,125,210,0.2)]',     dot: 'bg-[#2D7DD2]' },
  gravacao:   { label: 'Gravação',   color: 'text-[#D4A843]', bg: 'bg-[rgba(212,168,67,0.1)] border-[rgba(212,168,67,0.25)]',    dot: 'bg-[#D4A843]' },
  entrega:    { label: 'Entrega',    color: 'text-[#E87C6B]', bg: 'bg-[rgba(232,124,107,0.1)] border-[rgba(232,124,107,0.25)]',  dot: 'bg-[#E87C6B]' },
  revisao:    { label: 'Revisão',    color: 'text-[#9B7FD4]', bg: 'bg-[rgba(155,127,212,0.1)] border-[rgba(155,127,212,0.25)]',  dot: 'bg-[#9B7FD4]' },
  publicacao: { label: 'Publicação', color: 'text-[#4CAF88]', bg: 'bg-[rgba(76,175,136,0.1)] border-[rgba(76,175,136,0.25)]',   dot: 'bg-[#4CAF88]' },
  outro:      { label: 'Outro',      color: 'text-[#B0B8C4]', bg: 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)]',  dot: 'bg-[#B0B8C4]' },
}

function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function isTomorrow(iso: string) {
  const d = new Date(iso)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return d.getDate() === tomorrow.getDate() && d.getMonth() === tomorrow.getMonth() && d.getFullYear() === tomorrow.getFullYear()
}

export default async function CalendarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user!.id).single()

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('*')
      .eq('client_id', profile?.client_id ?? '')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true }),
    supabase
      .from('calendar_events')
      .select('*')
      .eq('client_id', profile?.client_id ?? '')
      .lt('event_date', new Date().toISOString())
      .order('event_date', { ascending: false })
      .limit(10),
  ])

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgba(45,125,210,0.1)] flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 text-[#2D7DD2]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Calendário</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Reuniões, gravações, entregas e publicações do seu projeto</p>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(typeConfig).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className="text-xs text-zinc-500">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Próximos eventos */}
      <section>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Próximos</p>
        {!upcoming || upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 bg-zinc-900 border border-zinc-800 rounded-2xl gap-3">
            <CalendarX className="w-8 h-8 text-zinc-700" />
            <p className="text-zinc-500 text-sm font-medium">Nenhum evento agendado</p>
            <p className="text-zinc-600 text-xs">A equipe Bkoulf vai adicionar seus eventos em breve</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((event) => {
              const cfg = typeConfig[event.type] ?? typeConfig.outro
              const date = new Date(event.event_date)
              const today = isToday(event.event_date)
              const tomorrow = isTomorrow(event.event_date)

              return (
                <div
                  key={event.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    today
                      ? 'bg-orange-500/5 border-[rgba(45,125,210,0.2)]'
                      : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  {/* Data */}
                  <div className={`shrink-0 text-center w-12 h-12 rounded-xl flex flex-col items-center justify-center ${today ? 'bg-[rgba(45,125,210,0.1)]' : 'bg-zinc-800'}`}>
                    <p className={`text-base font-black leading-none ${today ? 'text-[#2D7DD2]' : 'text-white'}`}>
                      {date.getDate().toString().padStart(2, '0')}
                    </p>
                    <p className={`text-xs uppercase mt-0.5 ${today ? 'text-[#2D7DD2]/70' : 'text-zinc-500'}`}>
                      {date.toLocaleString('pt-BR', { month: 'short' })}
                    </p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{event.title}</p>
                      {today && (
                        <span className="text-xs font-bold text-[#2D7DD2] bg-[rgba(45,125,210,0.1)] border border-[rgba(45,125,210,0.2)] px-2 py-0.5 rounded-full">
                          Hoje
                        </span>
                      )}
                      {tomorrow && (
                        <span className="text-xs font-semibold text-[#2D7DD2] bg-[rgba(45,125,210,0.1)] border border-[rgba(45,125,210,0.2)] px-2 py-0.5 rounded-full">
                          Amanhã
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-zinc-500 text-xs">
                      <Clock className="w-3 h-3" />
                      {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {event.description && (
                        <>
                          <span className="text-zinc-700">·</span>
                          <span className="truncate">{event.description}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tipo */}
                  <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 font-medium ${cfg.color} ${cfg.bg}`}>
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Eventos passados */}
      {past && past.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-3">Passados</p>
          <div className="space-y-2 opacity-50">
            {past.map((event) => {
              const cfg = typeConfig[event.type] ?? typeConfig.outro
              const date = new Date(event.event_date)
              return (
                <div key={event.id} className="flex items-center gap-4 p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <div className="shrink-0 text-center w-10">
                    <p className="text-sm font-bold text-[#B0B8C4] leading-none">{date.getDate().toString().padStart(2, '0')}</p>
                    <p className="text-xs text-zinc-600 uppercase mt-0.5">{date.toLocaleString('pt-BR', { month: 'short' })}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#B0B8C4] truncate">{event.title}</p>
                    <p className="text-xs text-zinc-600">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${cfg.color} ${cfg.bg}`}>{cfg.label}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
