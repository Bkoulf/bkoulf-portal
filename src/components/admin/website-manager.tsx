'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Globe, Loader2, Save, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClientItem { id: string; name: string; company?: string }

interface WebsiteForm {
  status: 'em_desenvolvimento' | 'em_revisao' | 'entregue' | 'manutencao'
  url: string
  plataforma: string
  hospedagem: string
  dominio: string
  painel_url: string
  painel_usuario: string
  painel_senha: string
  data_lancamento: string
  data_expiracao_dominio: string
  data_expiracao_hospedagem: string
  notas: string
}

const emptyForm: WebsiteForm = {
  status: 'em_desenvolvimento',
  url: '', plataforma: '', hospedagem: '', dominio: '',
  painel_url: '', painel_usuario: '', painel_senha: '',
  data_lancamento: '', data_expiracao_dominio: '', data_expiracao_hospedagem: '',
  notas: '',
}

// ─── Component ───────────────────────────────────────────────────────────────

export function WebsiteManager({ clients }: { clients: ClientItem[] }) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSenha, setShowSenha] = useState(false)
  const [form, setForm] = useState<WebsiteForm>(emptyForm)

  const inputCls  = 'bg-[#18181B] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)] text-sm h-9'
  const labelCls  = 'text-[#B0B8C4] text-xs'
  const selectCls = 'w-full bg-[#18181B] border border-[rgba(255,255,255,0.12)] text-white rounded-md px-2 h-9 text-sm focus:outline-none focus:border-zinc-500'

  function set<K extends keyof WebsiteForm>(key: K, value: WebsiteForm[K]) {
    setForm(p => ({ ...p, [key]: value }))
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!selectedClientId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/website?clienteId=${selectedClientId}`)
      const data = await res.json()
      if (data) {
        setForm({
          status: data.status ?? 'em_desenvolvimento',
          url: data.url ?? '',
          plataforma: data.plataforma ?? '',
          hospedagem: data.hospedagem ?? '',
          dominio: data.dominio ?? '',
          painel_url: data.painel_url ?? '',
          painel_usuario: data.painel_usuario ?? '',
          painel_senha: data.painel_senha ?? '',
          data_lancamento: data.data_lancamento ?? '',
          data_expiracao_dominio: data.data_expiracao_dominio ?? '',
          data_expiracao_hospedagem: data.data_expiracao_hospedagem ?? '',
          notas: data.notas ?? '',
        })
      } else {
        setForm(emptyForm)
      }
    } catch {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [selectedClientId])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        cliente_id: selectedClientId,
        status: form.status,
        url: form.url.trim() || null,
        plataforma: form.plataforma.trim() || null,
        hospedagem: form.hospedagem.trim() || null,
        dominio: form.dominio.trim() || null,
        painel_url: form.painel_url.trim() || null,
        painel_usuario: form.painel_usuario.trim() || null,
        painel_senha: form.painel_senha.trim() || null,
        data_lancamento: form.data_lancamento || null,
        data_expiracao_dominio: form.data_expiracao_dominio || null,
        data_expiracao_hospedagem: form.data_expiracao_hospedagem || null,
        notas: form.notas.trim() || null,
      }

      const res = await fetch('/api/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erro desconhecido')
      }

      toast.success('Configurações salvas!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Globe className="w-6 h-6 text-[#D4A843]" />
        <div>
          <h1 className="text-2xl font-bold text-white">Website</h1>
          <p className="text-[#B0B8C4] text-sm mt-0.5">Gerencie as configurações do site por cliente</p>
        </div>
      </div>

      {clients.length === 0 ? (
        <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
          <CardContent className="pt-6">
            <p className="text-[#B0B8C4] text-sm">
              Nenhum cliente com serviço de Website ativo. Configure em{' '}
              <a href="/admin/clientes" className="text-[#D4A843] hover:underline">Clientes</a>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Seletor de cliente */}
          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
            <CardContent className="pt-5">
              <div className="space-y-1.5">
                <Label className={labelCls}>Cliente</Label>
                <select
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  className={selectCls}
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.company ? ` — ${c.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center gap-2 text-[#B0B8C4] text-sm py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />Carregando...
            </div>
          ) : (
            <div className="space-y-5">

              {/* Bloco 1: Status e URL */}
              <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
                <CardHeader>
                  <CardTitle className="text-white text-base">Status e URL</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Status do projeto</Label>
                      <select
                        value={form.status}
                        onChange={e => set('status', e.target.value as WebsiteForm['status'])}
                        className={selectCls}
                      >
                        <option value="em_desenvolvimento">Em desenvolvimento</option>
                        <option value="em_revisao">Em revisão</option>
                        <option value="entregue">Entregue</option>
                        <option value="manutencao">Em manutenção</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>URL do site</Label>
                      <Input
                        value={form.url}
                        onChange={e => set('url', e.target.value)}
                        placeholder="https://exemplo.com.br"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bloco 2: Informações técnicas */}
              <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
                <CardHeader>
                  <CardTitle className="text-white text-base">Informações técnicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Plataforma</Label>
                      <Input
                        value={form.plataforma}
                        onChange={e => set('plataforma', e.target.value)}
                        placeholder="Ex: WordPress, Webflow, Next.js"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Hospedagem</Label>
                      <Input
                        value={form.hospedagem}
                        onChange={e => set('hospedagem', e.target.value)}
                        placeholder="Ex: Hostinger, Vercel, AWS"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Domínio</Label>
                      <Input
                        value={form.dominio}
                        onChange={e => set('dominio', e.target.value)}
                        placeholder="Ex: exemplo.com.br"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bloco 3: Credenciais do painel */}
              <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
                <CardHeader>
                  <CardTitle className="text-white text-base">Acesso ao painel administrativo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>URL do painel</Label>
                    <Input
                      value={form.painel_url}
                      onChange={e => set('painel_url', e.target.value)}
                      placeholder="https://exemplo.com.br/wp-admin"
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Usuário</Label>
                      <Input
                        value={form.painel_usuario}
                        onChange={e => set('painel_usuario', e.target.value)}
                        placeholder="admin"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Senha</Label>
                      <div className="relative">
                        <Input
                          type={showSenha ? 'text' : 'password'}
                          value={form.painel_senha}
                          onChange={e => set('painel_senha', e.target.value)}
                          placeholder="••••••••"
                          className={`${inputCls} pr-9`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSenha(p => !p)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[rgba(176,184,196,0.6)] hover:text-[#D0D8E4] transition-colors"
                        >
                          {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bloco 4: Datas */}
              <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
                <CardHeader>
                  <CardTitle className="text-white text-base">Datas importantes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Data de lançamento</Label>
                      <Input
                        type="date"
                        value={form.data_lancamento}
                        onChange={e => set('data_lancamento', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Expiração do domínio</Label>
                      <Input
                        type="date"
                        value={form.data_expiracao_dominio}
                        onChange={e => set('data_expiracao_dominio', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Expiração da hospedagem</Label>
                      <Input
                        type="date"
                        value={form.data_expiracao_hospedagem}
                        onChange={e => set('data_expiracao_hospedagem', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bloco 5: Observações */}
              <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
                <CardHeader>
                  <CardTitle className="text-white text-base">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={form.notas}
                    onChange={e => set('notas', e.target.value)}
                    placeholder="Informações adicionais sobre o site, instruções, alertas..."
                    className="bg-[#18181B] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)] text-sm min-h-[100px]"
                  />
                </CardContent>
              </Card>

              {/* Salvar */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold"
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                    : <><Save className="w-4 h-4 mr-2" />Salvar configurações</>
                  }
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
