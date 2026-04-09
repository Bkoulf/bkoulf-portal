'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

interface ServiceData {
  id?: string
  enabled: boolean
  status: string
  start_date: string
  end_date: string
  notes: string
}

type ServicesState = Record<string, ServiceData>

interface Props {
  open: boolean
  clientId: string
  clientName: string
  onClose: () => void
}

const serviceTypes = [
  { key: 'trafego_pago', label: 'Tráfego Pago' },
  { key: 'edicao_videos', label: 'Edição de Vídeos' },
  { key: 'identidade_visual', label: 'Identidade Visual' },
  { key: 'website', label: 'Website' },
]

export function ServiceConfigModal({ open, clientId, clientName, onClose }: Props) {
  const [services, setServices] = useState<ServicesState>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!open || !clientId) return
    setLoading(true)

    supabase.from('services').select('*').eq('client_id', clientId).then(({ data }) => {
      const state: ServicesState = {}
      for (const type of serviceTypes) {
        const existing = data?.find(s => s.type === type.key)
        state[type.key] = {
          id: existing?.id,
          enabled: !!existing,
          status: existing?.status ?? 'ativo',
          start_date: existing?.start_date ?? '',
          end_date: existing?.end_date ?? '',
          notes: existing?.notes ?? '',
        }
      }
      setServices(state)
      setLoading(false)
    })
  }, [open, clientId])

  function update(type: string, patch: Partial<ServiceData>) {
    setServices(prev => ({ ...prev, [type]: { ...prev[type], ...patch } }))
  }

  async function handleSave() {
    setSaving(true)

    for (const type of serviceTypes) {
      const svc = services[type.key]
      if (!svc) continue

      if (svc.enabled) {
        if (svc.id) {
          await supabase.from('services').update({
            status: svc.status,
            start_date: svc.start_date || null,
            end_date: svc.end_date || null,
            notes: svc.notes || null,
          }).eq('id', svc.id)
        } else {
          await supabase.from('services').insert({
            client_id: clientId,
            type: type.key,
            status: svc.status,
            start_date: svc.start_date || null,
            end_date: svc.end_date || null,
            notes: svc.notes || null,
          })
        }
      } else if (svc.id) {
        await supabase.from('services').delete().eq('id', svc.id)
      }
    }

    toast.success('Serviços atualizados!')
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Serviços — {clientName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 text-[#B0B8C4] text-sm py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />Carregando...
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {serviceTypes.map(({ key, label }) => {
              const svc = services[key]
              if (!svc) return null
              const isOpen = expanded === key

              return (
                <div key={key} className={`rounded-lg border transition-colors ${svc.enabled ? 'border-[rgba(255,255,255,0.08)] bg-[#1C2333]' : 'border-[rgba(255,255,255,0.08)] bg-[#1C2333]/50'}`}>
                  <div className="flex items-center gap-3 p-3">
                    <input
                      type="checkbox"
                      checked={svc.enabled}
                      onChange={e => {
                        update(key, { enabled: e.target.checked })
                        if (e.target.checked) setExpanded(key)
                      }}
                      className="w-4 h-4 accent-amber-400 shrink-0"
                    />
                    <span className={`text-sm font-medium flex-1 ${svc.enabled ? 'text-white' : 'text-[rgba(176,184,196,0.6)]'}`}>
                      {label}
                    </span>
                    {svc.enabled && (
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : key)}
                        className="text-[#B0B8C4] hover:text-white p-1"
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {svc.enabled && isOpen && (
                    <div className="px-3 pb-4 space-y-4 border-t border-[rgba(255,255,255,0.12)] pt-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-[#B0B8C4] text-xs">Início</Label>
                          <Input
                            type="date"
                            value={svc.start_date}
                            onChange={e => update(key, { start_date: e.target.value })}
                            className="bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.15)] text-white text-xs h-8"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[#B0B8C4] text-xs">Término</Label>
                          <Input
                            type="date"
                            value={svc.end_date}
                            onChange={e => update(key, { end_date: e.target.value })}
                            className="bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.15)] text-white text-xs h-8"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[#B0B8C4] text-xs">Andamento</Label>
                          <select
                            value={svc.status}
                            onChange={e => update(key, { status: e.target.value })}
                            className="w-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.15)] text-white rounded-md px-2 h-8 text-xs focus:outline-none"
                          >
                            <option value="ativo">Ativo</option>
                            <option value="pausado">Pausado</option>
                            <option value="concluido">Concluído</option>
                            <option value="pendente">Pendente</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[#B0B8C4] text-xs">Observação</Label>
                        <Textarea
                          value={svc.notes}
                          onChange={e => update(key, { notes: e.target.value })}
                          placeholder="Observações sobre este serviço..."
                          className="bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.15)] text-white text-sm placeholder:text-[rgba(176,184,196,0.6)] min-h-[80px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" className="border-[rgba(255,255,255,0.12)] text-[#D0D8E4]" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || loading} className="bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
