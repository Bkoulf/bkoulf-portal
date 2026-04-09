'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { Users, Plus, Settings, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ServiceConfigModal } from './service-config-modal'

interface Client { id: string; name: string; email: string; phone?: string; company?: string; plan?: string; status: string; created_at: string }
interface Profile { id: string; full_name: string; email: string; client_id?: string; role: string }

export function ClientesTable({ clients: initialClients, profiles }: { clients: Client[]; profiles: Profile[] }) {
  const [clients, setClients] = useState(initialClients)
  const [showNew, setShowNew] = useState(false)
  const [showServices, setShowServices] = useState<{ open: boolean; clientId: string; clientName: string } | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', plan: '', userEmail: '', userPassword: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    // 1. Cria o cliente
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({ name: form.name, email: form.email, phone: form.phone || null, company: form.company || null, plan: form.plan || null })
      .select()
      .single()

    if (clientError || !newClient) {
      toast.error('Erro ao criar cliente')
      setSaving(false)
      return
    }

    // 2. Cria o usuário no Auth (via API route)
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.userEmail,
        password: form.userPassword,
        fullName: form.name,
        clientId: newClient.id,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error ?? 'Erro ao criar usuário')
      setSaving(false)
      return
    }

    setClients(prev => [newClient as Client, ...prev])
    setShowNew(false)
    setForm({ name: '', email: '', phone: '', company: '', plan: '', userEmail: '', userPassword: '' })
    toast.success('Cliente criado com sucesso!')
    router.refresh()
    setSaving(false)
  }

  function openServicesDialog(clientId: string, clientName: string) {
    setShowServices({ open: true, clientId, clientName })
  }

  async function handleToggleStatus(client: Client) {
    const newStatus = client.status === 'ativo' ? 'inativo' : 'ativo'
    const { error } = await supabase
      .from('clients')
      .update({ status: newStatus })
      .eq('id', client.id)

    if (error) {
      toast.error('Erro ao atualizar status')
      return
    }

    setClients(prev =>
      prev.map(c => c.id === client.id ? { ...c, status: newStatus } : c)
    )
    toast.success(
      newStatus === 'ativo'
        ? `${client.name} reativado`
        : `${client.name} inativado por pendência`
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#D4A843]" />
            <div>
              <h1 className="text-2xl font-bold text-white">Clientes</h1>
              <p className="text-[#B0B8C4] text-sm mt-0.5">{clients.length} clientes cadastrados</p>
            </div>
          </div>
          <Button onClick={() => setShowNew(true)} className="bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Novo cliente
          </Button>
        </div>

        <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
          <CardContent className="pt-6">
            {clients.length === 0 ? (
              <p className="text-[rgba(176,184,196,0.6)] text-sm">Nenhum cliente cadastrado ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.08)]">
                      <th className="text-left text-[#B0B8C4] font-medium pb-3 pr-4">Cliente</th>
                      <th className="text-left text-[#B0B8C4] font-medium pb-3 pr-4">Empresa</th>
                      <th className="text-left text-[#B0B8C4] font-medium pb-3 pr-4">Plano</th>
                      <th className="text-left text-[#B0B8C4] font-medium pb-3 pr-4">Status</th>
                      <th className="text-left text-[#B0B8C4] font-medium pb-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id} className="border-b border-[rgba(255,255,255,0.08)]/50 last:border-0">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-white">{client.name}</p>
                          <p className="text-xs text-[rgba(176,184,196,0.6)]">{client.email}</p>
                        </td>
                        <td className="py-3 pr-4 text-[#D0D8E4]">{client.company ?? '—'}</td>
                        <td className="py-3 pr-4 text-[#D0D8E4]">{client.plan ?? '—'}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={client.status === 'ativo' ? 'default' : 'secondary'}
                            className={client.status === 'inativo' ? 'bg-[rgba(255,255,255,0.04)] text-[rgba(176,184,196,0.7)] border-[rgba(255,255,255,0.1)]' : ''}>
                            {client.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-[#B0B8C4] hover:text-white hover:bg-[#1C2333]"
                              onClick={() => openServicesDialog(client.id, client.name)}
                            >
                              <Settings className="w-3.5 h-3.5 mr-1.5" />
                              Serviços
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 text-xs ${client.status === 'ativo' ? 'text-[rgba(176,184,196,0.7)] hover:bg-[rgba(255,255,255,0.04)]' : 'text-[#D4A843] hover:bg-[rgba(255,255,255,0.05)]'}`}
                              onClick={() => handleToggleStatus(client)}
                              title={client.status === 'ativo' ? 'Inativar por pendência' : 'Reativar cliente'}
                            >
                              {client.status === 'ativo'
                                ? <><ToggleRight className="w-3.5 h-3.5 mr-1.5" />Inativar</>
                                : <><ToggleLeft className="w-3.5 h-3.5 mr-1.5" />Reativar</>
                              }
                            </Button>
                          </div>
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

      {/* Modal: Novo cliente */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateClient} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-[#D0D8E4]">Nome completo *</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Nome do cliente" className="bg-[#1C2333] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#D0D8E4]">Email do cliente</Label>
                <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@empresa.com" className="bg-[#1C2333] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#D0D8E4]">Telefone</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" className="bg-[#1C2333] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#D0D8E4]">Empresa</Label>
                <Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Nome da empresa" className="bg-[#1C2333] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#D0D8E4]">Plano</Label>
                <Input value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))} placeholder="Ex: BK4 Completo" className="bg-[#1C2333] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)]" />
              </div>
            </div>

            <div className="border-t border-[rgba(255,255,255,0.08)] pt-4 space-y-3">
              <p className="text-sm font-medium text-[#D0D8E4]">Acesso ao portal</p>
              <div className="space-y-1.5">
                <Label className="text-[#D0D8E4]">Email de login *</Label>
                <Input type="email" value={form.userEmail} onChange={e => setForm(p => ({ ...p, userEmail: e.target.value }))} required placeholder="Email para o cliente acessar" className="bg-[#1C2333] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#D0D8E4]">Senha inicial *</Label>
                <Input type="password" value={form.userPassword} onChange={e => setForm(p => ({ ...p, userPassword: e.target.value }))} required placeholder="Mínimo 6 caracteres" className="bg-[#1C2333] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)]" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" className="border-[rgba(255,255,255,0.12)] text-[#D0D8E4]" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</> : 'Criar cliente'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {showServices && (
        <ServiceConfigModal
          open={showServices.open}
          clientId={showServices.clientId}
          clientName={showServices.clientName}
          onClose={() => setShowServices(null)}
        />
      )}
    </>
  )
}
