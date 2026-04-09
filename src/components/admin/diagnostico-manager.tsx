'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Zap, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Client { id: string; name: string }
interface Diagnostic { id: string; client_id: string; score: number; identity_score: number; audiovisual_score: number; digital_score: number; conversion_score: number; problems: string[]; opportunities: string[]; notes?: string; created_at: string }

const stages = [
  { key: 'identity_score', label: 'Identidade Visual' },
  { key: 'audiovisual_score', label: 'Audiovisual' },
  { key: 'digital_score', label: 'Presença Digital' },
  { key: 'conversion_score', label: 'Conversão e Tráfego' },
]

export function DiagnosticoManager({ clients, diagnostics: initial }: { clients: Client[]; diagnostics: Diagnostic[] }) {
  const [diagnostics, setDiagnostics] = useState(initial)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    clientId: '',
    identity_score: '0',
    audiovisual_score: '0',
    digital_score: '0',
    conversion_score: '0',
    problems: '',
    opportunities: '',
    notes: '',
  })
  const supabase = createClient()
  const router = useRouter()

  const overall = Math.round(
    (parseInt(form.identity_score || '0') +
     parseInt(form.audiovisual_score || '0') +
     parseInt(form.digital_score || '0') +
     parseInt(form.conversion_score || '0')) / 4
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientId) { toast.error('Selecione o cliente'); return }
    setSaving(true)

    const { data, error } = await supabase
      .from('bk4_diagnostics')
      .insert({
        client_id: form.clientId,
        score: overall,
        identity_score: parseInt(form.identity_score),
        audiovisual_score: parseInt(form.audiovisual_score),
        digital_score: parseInt(form.digital_score),
        conversion_score: parseInt(form.conversion_score),
        problems: form.problems.split('\n').map(s => s.trim()).filter(Boolean),
        opportunities: form.opportunities.split('\n').map(s => s.trim()).filter(Boolean),
        notes: form.notes || null,
      })
      .select()
      .single()

    if (error) {
      toast.error('Erro ao salvar diagnóstico')
    } else {
      setDiagnostics(prev => [data as Diagnostic, ...prev])
      setShowNew(false)
      setForm({ clientId: '', identity_score: '0', audiovisual_score: '0', digital_score: '0', conversion_score: '0', problems: '', opportunities: '', notes: '' })
      toast.success('Diagnóstico criado!')
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
            <Zap className="w-6 h-6 text-[#D4A843]" />
            <div>
              <h1 className="text-2xl font-bold text-white">Diagnósticos BK4</h1>
              <p className="text-[#B0B8C4] text-sm mt-0.5">{diagnostics.length} diagnósticos registrados</p>
            </div>
          </div>
          <Button onClick={() => setShowNew(true)} className="bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Novo diagnóstico
          </Button>
        </div>

        <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
          <CardContent className="pt-6">
            {diagnostics.length === 0 ? (
              <p className="text-[rgba(176,184,196,0.6)] text-sm">Nenhum diagnóstico registrado ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.08)]">
                      <th className="text-left text-[#B0B8C4] font-medium pb-3 pr-4">Cliente</th>
                      <th className="text-left text-[#B0B8C4] font-medium pb-3 pr-4">Score Geral</th>
                      <th className="text-left text-[#B0B8C4] font-medium pb-3 pr-4">Identidade</th>
                      <th className="text-left text-[#B0B8C4] font-medium pb-3 pr-4">Audiovisual</th>
                      <th className="text-left text-[#B0B8C4] font-medium pb-3 pr-4">Digital</th>
                      <th className="text-left text-[#B0B8C4] font-medium pb-3">Conversão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diagnostics.map((d) => (
                      <tr key={d.id} className="border-b border-[rgba(255,255,255,0.08)]/50 last:border-0">
                        <td className="py-3 pr-4 font-medium text-white">{getClientName(d.client_id)}</td>
                        <td className="py-3 pr-4">
                          <span className={`font-bold text-lg ${d.score >= 80 ? 'text-[#D4A843]' : d.score >= 60 ? 'text-[#D4A843]' : 'text-[rgba(176,184,196,0.7)]'}`}>
                            {d.score}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-[#D0D8E4]">{d.identity_score}</td>
                        <td className="py-3 pr-4 text-[#D0D8E4]">{d.audiovisual_score}</td>
                        <td className="py-3 pr-4 text-[#D0D8E4]">{d.digital_score}</td>
                        <td className="py-3 text-[#D0D8E4]">{d.conversion_score}</td>
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
        <DialogContent className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Diagnóstico BK4</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-[#D0D8E4]">Cliente *</Label>
              <select
                value={form.clientId}
                onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}
                required
                className="w-full bg-[#1C2333] border border-[rgba(255,255,255,0.12)] text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              >
                <option value="">Selecione</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {stages.map(stage => (
                <div key={stage.key} className="space-y-1.5">
                  <Label className="text-[#D0D8E4]">{stage.label} (0-100)</Label>
                  <Input
                    type="number" min="0" max="100"
                    value={form[stage.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [stage.key]: e.target.value }))}
                    className="bg-[#1C2333] border-[rgba(255,255,255,0.12)] text-white"
                  />
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#1C2333] rounded-lg text-center">
              <p className="text-[#B0B8C4] text-xs">Score Geral (calculado)</p>
              <p className={`text-3xl font-bold mt-1 ${overall >= 80 ? 'text-[#D4A843]' : overall >= 60 ? 'text-[#D4A843]' : 'text-[rgba(176,184,196,0.7)]'}`}>
                {overall}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#D0D8E4]">Pontos de atenção (um por linha)</Label>
              <Textarea
                value={form.problems}
                onChange={e => setForm(p => ({ ...p, problems: e.target.value }))}
                placeholder="Ex: Identidade visual inconsistente&#10;Falta de presença no Instagram"
                className="bg-[#1C2333] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)] min-h-[80px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#D0D8E4]">Oportunidades (uma por linha)</Label>
              <Textarea
                value={form.opportunities}
                onChange={e => setForm(p => ({ ...p, opportunities: e.target.value }))}
                placeholder="Ex: Alto potencial para tráfego pago&#10;Nicho com pouca concorrência"
                className="bg-[#1C2333] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)] min-h-[80px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#D0D8E4]">Observações gerais</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Comentários adicionais..."
                className="bg-[#1C2333] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" className="border-[rgba(255,255,255,0.12)] text-[#D0D8E4]" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar diagnóstico'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
