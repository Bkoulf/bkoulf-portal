'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BarChart2, Plus, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const serviceLabels: Record<string, string> = {
  trafego_pago: 'Tráfego Pago',
  edicao_videos: 'Edição de Vídeos',
  identidade_visual: 'Identidade Visual',
  website: 'Website',
}

interface Client { id: string; name: string }
interface Report { id: string; client_id: string; service_type: string; period: string; title: string; file_url?: string; created_at: string }

export function RelatoriosManager({ clients, reports: initial }: { clients: Client[]; reports: Report[] }) {
  const [reports, setReports] = useState(initial)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ clientId: '', serviceType: 'trafego_pago', period: '', title: '', fileUrl: '' })
  const supabase = createClient()
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientId) { toast.error('Selecione o cliente'); return }
    setSaving(true)

    const { data, error } = await supabase
      .from('reports')
      .insert({
        client_id: form.clientId,
        service_type: form.serviceType,
        period: form.period,
        title: form.title,
        file_url: form.fileUrl || null,
        data: {},
      })
      .select()
      .single()

    if (error) {
      toast.error('Erro ao criar relatório')
    } else {
      setReports(prev => [data as Report, ...prev])
      setShowNew(false)
      setForm({ clientId: '', serviceType: 'trafego_pago', period: '', title: '', fileUrl: '' })
      toast.success('Relatório adicionado!')
      router.refresh()
    }
    setSaving(false)
  }

  function getClientName(id: string) {
    return clients.find(c => c.id === id)?.name ?? '—'
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-6 h-6 text-[#D4A843]" />
            <div>
              <h1 className="text-2xl font-bold text-white">Relatórios</h1>
              <p className="text-[#B0B8C4] text-sm mt-0.5">{reports.length} relatórios registrados</p>
            </div>
          </div>
          <Button onClick={() => setShowNew(true)} className="bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Novo relatório
          </Button>
        </div>

        <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
          <CardContent className="pt-6">
            {reports.length === 0 ? (
              <p className="text-[rgba(176,184,196,0.6)] text-sm">Nenhum relatório registrado ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.08)]">
                      <th className="text-left text-[#B0B8C4] font-medium pb-3 pr-4">Título</th>
                      <th className="text-left text-[#B0B8C4] font-medium pb-3 pr-4">Cliente</th>
                      <th className="text-left text-[#B0B8C4] font-medium pb-3 pr-4">Serviço</th>
                      <th className="text-left text-[#B0B8C4] font-medium pb-3 pr-4">Período</th>
                      <th className="text-left text-[#B0B8C4] font-medium pb-3">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id} className="border-b border-[rgba(255,255,255,0.08)]/50 last:border-0">
                        <td className="py-3 pr-4 font-medium text-white">{r.title}</td>
                        <td className="py-3 pr-4 text-[#D0D8E4]">{getClientName(r.client_id)}</td>
                        <td className="py-3 pr-4 text-[#D0D8E4]">{serviceLabels[r.service_type]}</td>
                        <td className="py-3 pr-4 text-[#B0B8C4] text-xs">{r.period}</td>
                        <td className="py-3">
                          {r.file_url ? (
                            <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-[#D4A843] hover:text-[#D4A843]">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Novo relatório</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-[#D0D8E4]">Cliente *</Label>
              <select value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))} required className="w-full bg-[#18181B] border border-[rgba(255,255,255,0.12)] text-white rounded-md px-3 py-2 text-sm focus:outline-none">
                <option value="">Selecione</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[#D0D8E4]">Serviço *</Label>
                <select value={form.serviceType} onChange={e => setForm(p => ({ ...p, serviceType: e.target.value }))} className="w-full bg-[#18181B] border border-[rgba(255,255,255,0.12)] text-white rounded-md px-3 py-2 text-sm focus:outline-none">
                  {Object.entries(serviceLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#D0D8E4]">Período *</Label>
                <Input value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))} required placeholder="Ex: Março 2026" className="bg-[#18181B] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#D0D8E4]">Título *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="Ex: Relatório de Performance - Março" className="bg-[#18181B] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#D0D8E4]">Link do relatório</Label>
              <Input value={form.fileUrl} onChange={e => setForm(p => ({ ...p, fileUrl: e.target.value }))} placeholder="https://..." className="bg-[#18181B] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)]" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" className="border-[rgba(255,255,255,0.12)] text-[#D0D8E4]" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
