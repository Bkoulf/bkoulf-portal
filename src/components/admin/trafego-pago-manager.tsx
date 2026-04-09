'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TrendingUp, Plus, Trash2, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

interface ClientItem {
  id: string
  name: string
  company?: string
}

interface MetricasForm {
  investimento: string
  leads: string
  cliques: string
  impressoes: string
  roas: string
}

interface CampanhaForm {
  nome: string
  status: 'ativo' | 'pausado' | 'encerrado'
  investimento: string
  leads: string
  cliques: string
}

interface CriativoForm {
  nome: string
  tipo: 'imagem' | 'video' | 'carrossel'
  impressoes: string
  cliques: string
  leads: string
  ctr: string
  thumbnail_url: string
}

const emptyMetricas: MetricasForm = {
  investimento: '',
  leads: '',
  cliques: '',
  impressoes: '',
  roas: '',
}

const emptyCampanha: CampanhaForm = {
  nome: '',
  status: 'ativo',
  investimento: '',
  leads: '',
  cliques: '',
}

const emptyCriativo: CriativoForm = {
  nome: '',
  tipo: 'imagem',
  impressoes: '',
  cliques: '',
  leads: '',
  ctr: '',
  thumbnail_url: '',
}

function getCurrentPeriod(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function TrafegoPagoManager({ clients }: { clients: ClientItem[] }) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? '')
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [metricas, setMetricas] = useState<MetricasForm>(emptyMetricas)
  const [campanhas, setCampanhas] = useState<CampanhaForm[]>([])
  const [criativos, setCriativos] = useState<CriativoForm[]>([])

  const fetchData = useCallback(async () => {
    if (!selectedClientId || !selectedPeriod) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/trafego-pago?client_id=${selectedClientId}&periodo=${selectedPeriod}`
      )
      if (!res.ok) throw new Error()
      const data = await res.json()

      if (data.metricas) {
        setMetricas({
          investimento: String(data.metricas.investimento ?? ''),
          leads: String(data.metricas.leads ?? ''),
          cliques: String(data.metricas.cliques ?? ''),
          impressoes: String(data.metricas.impressoes ?? ''),
          roas: String(data.metricas.roas ?? ''),
        })
      } else {
        setMetricas(emptyMetricas)
      }

      setCampanhas(
        (data.campanhas ?? []).map((c: Record<string, string | number>) => ({
          nome: String(c.nome ?? ''),
          status: (c.status as 'ativo' | 'pausado' | 'encerrado') ?? 'ativo',
          investimento: String(c.investimento ?? ''),
          leads: String(c.leads ?? ''),
          cliques: String(c.cliques ?? ''),
        }))
      )

      setCriativos(
        (data.criativos ?? []).map((c: Record<string, string | number>) => ({
          nome: String(c.nome ?? ''),
          tipo: (c.tipo as 'imagem' | 'video' | 'carrossel') ?? 'imagem',
          impressoes: String(c.impressoes ?? ''),
          cliques: String(c.cliques ?? ''),
          leads: String(c.leads ?? ''),
          ctr: String(c.ctr ?? ''),
          thumbnail_url: String(c.thumbnail_url ?? ''),
        }))
      )
    } catch {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [selectedClientId, selectedPeriod])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSave() {
    if (!selectedClientId || !selectedPeriod) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/trafego-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          periodo: selectedPeriod,
          metricas: {
            investimento: parseFloat(metricas.investimento) || 0,
            leads: parseInt(metricas.leads) || 0,
            cliques: parseInt(metricas.cliques) || 0,
            impressoes: parseInt(metricas.impressoes) || 0,
            roas: parseFloat(metricas.roas) || 0,
          },
          campanhas: campanhas.map(c => ({
            nome: c.nome,
            status: c.status,
            investimento: parseFloat(c.investimento) || 0,
            leads: parseInt(c.leads) || 0,
            cliques: parseInt(c.cliques) || 0,
          })),
          criativos: criativos.map(c => ({
            nome: c.nome,
            tipo: c.tipo,
            impressoes: parseInt(c.impressoes) || 0,
            cliques: parseInt(c.cliques) || 0,
            leads: parseInt(c.leads) || 0,
            ctr: parseFloat(c.ctr) || 0,
            thumbnail_url: c.thumbnail_url || null,
          })),
        }),
      })

      if (!res.ok) throw new Error()
      toast.success('Métricas salvas com sucesso!')
    } catch {
      toast.error('Erro ao salvar métricas')
    } finally {
      setSaving(false)
    }
  }

  function updateMetricas(field: keyof MetricasForm, value: string) {
    setMetricas(prev => ({ ...prev, [field]: value }))
  }

  function addCampanha() {
    setCampanhas(prev => [...prev, { ...emptyCampanha }])
  }

  function removeCampanha(i: number) {
    setCampanhas(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateCampanha(i: number, field: keyof CampanhaForm, value: string) {
    setCampanhas(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  function addCriativo() {
    setCriativos(prev => [...prev, { ...emptyCriativo }])
  }

  function removeCriativo(i: number) {
    setCriativos(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateCriativo(i: number, field: keyof CriativoForm, value: string) {
    setCriativos(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  const inputCls = 'bg-[#1C2333] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)] text-sm h-9'
  const labelCls = 'text-[#B0B8C4] text-xs'
  const selectCls = 'w-full bg-[#1C2333] border border-[rgba(255,255,255,0.12)] text-white rounded-md px-2 h-9 text-sm focus:outline-none focus:border-zinc-500'

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-[#D4A843]" />
        <div>
          <h1 className="text-2xl font-bold text-white">Tráfego Pago</h1>
          <p className="text-[#B0B8C4] text-sm mt-0.5">Inserir e editar métricas por cliente</p>
        </div>
      </div>

      {clients.length === 0 ? (
        <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
          <CardContent className="pt-6">
            <p className="text-[#B0B8C4] text-sm">
              Nenhum cliente com serviço de Tráfego Pago ativo. Configure os serviços em{' '}
              <a href="/admin/clientes" className="text-[#D4A843] hover:underline">Clientes</a>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Client + Period selectors */}
          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="space-y-1.5">
                  <Label className={labelCls}>Período</Label>
                  <Input
                    type="month"
                    value={selectedPeriod}
                    onChange={e => setSelectedPeriod(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center gap-2 text-[#B0B8C4] text-sm py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando dados...
            </div>
          ) : (
            <Tabs defaultValue="metricas">
              <TabsList className="bg-[#1C2333] border border-[rgba(255,255,255,0.12)] mb-4">
                <TabsTrigger value="metricas" className="data-active:bg-[rgba(255,255,255,0.1)] data-active:text-white text-[#B0B8C4] text-sm">
                  Métricas
                </TabsTrigger>
                <TabsTrigger value="campanhas" className="data-active:bg-[rgba(255,255,255,0.1)] data-active:text-white text-[#B0B8C4] text-sm">
                  Campanhas ({campanhas.length})
                </TabsTrigger>
                <TabsTrigger value="criativos" className="data-active:bg-[rgba(255,255,255,0.1)] data-active:text-white text-[#B0B8C4] text-sm">
                  Criativos ({criativos.length})
                </TabsTrigger>
              </TabsList>

              {/* Métricas tab */}
              <TabsContent value="metricas">
                <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
                  <CardHeader>
                    <CardTitle className="text-white text-base">Métricas do período</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Investimento (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={metricas.investimento}
                          onChange={e => updateMetricas('investimento', e.target.value)}
                          placeholder="0.00"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Leads</Label>
                        <Input
                          type="number"
                          min="0"
                          value={metricas.leads}
                          onChange={e => updateMetricas('leads', e.target.value)}
                          placeholder="0"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Cliques</Label>
                        <Input
                          type="number"
                          min="0"
                          value={metricas.cliques}
                          onChange={e => updateMetricas('cliques', e.target.value)}
                          placeholder="0"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Impressões</Label>
                        <Input
                          type="number"
                          min="0"
                          value={metricas.impressoes}
                          onChange={e => updateMetricas('impressoes', e.target.value)}
                          placeholder="0"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>ROAS</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={metricas.roas}
                          onChange={e => updateMetricas('roas', e.target.value)}
                          placeholder="0.00"
                          className={inputCls}
                        />
                      </div>
                    </div>

                    {/* Computed fields (read-only) */}
                    {(metricas.investimento || metricas.leads) && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                        <div>
                          <p className="text-xs text-[rgba(176,184,196,0.6)] mb-1">CPL calculado</p>
                          <p className="text-sm font-medium text-[#D0D8E4]">
                            {parseInt(metricas.leads) > 0
                              ? `R$ ${(parseFloat(metricas.investimento || '0') / parseInt(metricas.leads)).toFixed(2)}`
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[rgba(176,184,196,0.6)] mb-1">CTR calculado</p>
                          <p className="text-sm font-medium text-[#D0D8E4]">
                            {parseInt(metricas.impressoes) > 0
                              ? `${((parseInt(metricas.cliques || '0') / parseInt(metricas.impressoes)) * 100).toFixed(2)}%`
                              : '—'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Campanhas tab */}
              <TabsContent value="campanhas">
                <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-base">Campanhas do período</CardTitle>
                      <Button
                        onClick={addCampanha}
                        size="sm"
                        className="h-8 text-xs bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Adicionar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {campanhas.length === 0 ? (
                      <p className="text-[rgba(176,184,196,0.6)] text-sm">Nenhuma campanha adicionada. Clique em &quot;Adicionar&quot; para começar.</p>
                    ) : (
                      campanhas.map((c, i) => (
                        <div key={i} className="bg-[#1C2333] rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#B0B8C4] font-medium">Campanha {i + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeCampanha(i)}
                              className="text-[rgba(176,184,196,0.6)] hover:text-[rgba(176,184,196,0.7)] transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="col-span-2 sm:col-span-2 space-y-1.5">
                              <Label className={labelCls}>Nome da campanha</Label>
                              <Input
                                value={c.nome}
                                onChange={e => updateCampanha(i, 'nome', e.target.value)}
                                placeholder="Ex: Campanha Meta - Leads"
                                className={inputCls}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className={labelCls}>Status</Label>
                              <select
                                value={c.status}
                                onChange={e => updateCampanha(i, 'status', e.target.value)}
                                className={selectCls}
                              >
                                <option value="ativo">Ativo</option>
                                <option value="pausado">Pausado</option>
                                <option value="encerrado">Encerrado</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className={labelCls}>Investimento (R$)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={c.investimento}
                                onChange={e => updateCampanha(i, 'investimento', e.target.value)}
                                placeholder="0.00"
                                className={inputCls}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className={labelCls}>Leads</Label>
                              <Input
                                type="number"
                                min="0"
                                value={c.leads}
                                onChange={e => updateCampanha(i, 'leads', e.target.value)}
                                placeholder="0"
                                className={inputCls}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className={labelCls}>Cliques</Label>
                              <Input
                                type="number"
                                min="0"
                                value={c.cliques}
                                onChange={e => updateCampanha(i, 'cliques', e.target.value)}
                                placeholder="0"
                                className={inputCls}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Criativos tab */}
              <TabsContent value="criativos">
                <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-base">Criativos do período</CardTitle>
                      <Button
                        onClick={addCriativo}
                        size="sm"
                        className="h-8 text-xs bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold"
                        disabled={criativos.length >= 3}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Adicionar
                      </Button>
                    </div>
                    <p className="text-[rgba(176,184,196,0.6)] text-xs">Máximo de 3 criativos (exibidos como top performers)</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {criativos.length === 0 ? (
                      <p className="text-[rgba(176,184,196,0.6)] text-sm">Nenhum criativo adicionado. Clique em &quot;Adicionar&quot; para começar.</p>
                    ) : (
                      criativos.map((c, i) => (
                        <div key={i} className="bg-[#1C2333] rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#B0B8C4] font-medium">Criativo #{i + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeCriativo(i)}
                              className="text-[rgba(176,184,196,0.6)] hover:text-[rgba(176,184,196,0.7)] transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="col-span-2 space-y-1.5">
                              <Label className={labelCls}>Nome do criativo</Label>
                              <Input
                                value={c.nome}
                                onChange={e => updateCriativo(i, 'nome', e.target.value)}
                                placeholder="Ex: Video Depoimento Cliente"
                                className={inputCls}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className={labelCls}>Tipo</Label>
                              <select
                                value={c.tipo}
                                onChange={e => updateCriativo(i, 'tipo', e.target.value)}
                                className={selectCls}
                              >
                                <option value="imagem">Imagem</option>
                                <option value="video">Vídeo</option>
                                <option value="carrossel">Carrossel</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className={labelCls}>Impressões</Label>
                              <Input
                                type="number"
                                min="0"
                                value={c.impressoes}
                                onChange={e => updateCriativo(i, 'impressoes', e.target.value)}
                                placeholder="0"
                                className={inputCls}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className={labelCls}>Cliques</Label>
                              <Input
                                type="number"
                                min="0"
                                value={c.cliques}
                                onChange={e => updateCriativo(i, 'cliques', e.target.value)}
                                placeholder="0"
                                className={inputCls}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className={labelCls}>Leads</Label>
                              <Input
                                type="number"
                                min="0"
                                value={c.leads}
                                onChange={e => updateCriativo(i, 'leads', e.target.value)}
                                placeholder="0"
                                className={inputCls}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className={labelCls}>CTR (%)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={c.ctr}
                                onChange={e => updateCriativo(i, 'ctr', e.target.value)}
                                placeholder="0.00"
                                className={inputCls}
                              />
                            </div>
                            <div className="col-span-2 sm:col-span-3 space-y-1.5">
                              <Label className={labelCls}>URL da thumbnail (opcional)</Label>
                              <Input
                                type="url"
                                value={c.thumbnail_url}
                                onChange={e => updateCriativo(i, 'thumbnail_url', e.target.value)}
                                placeholder="https://..."
                                className={inputCls}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Save button */}
          {!loading && (
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                  : <><Save className="w-4 h-4 mr-2" />Salvar métricas</>
                }
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
