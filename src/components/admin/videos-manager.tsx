'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Video, Plus, Loader2, Save, Trash2, Film,
  Upload, Link as LinkIcon, CheckCircle2, Clock, Pencil,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClientItem { id: string; name: string; company?: string }

interface Contrato {
  id: string
  cliente_id: string
  total_combinado: number
  data_entrega: string | null
}

interface VideoItem {
  id: string
  cliente_id: string
  titulo: string
  descricao: string | null
  status: 'pendente' | 'em_edicao' | 'entregue' | 'aprovado' | 'reprovado'
  arquivo_url: string | null
  tamanho_arquivo: number | null
  resolucao: string
  thumbnail_url: string | null
  criado_em: string
}

interface VideoForm {
  titulo: string
  descricao: string
  resolucao: '4K' | '1080p' | '720p'
  arquivo_url: string
  tamanho_arquivo: string
  thumbnail_url: string
}

const emptyForm: VideoForm = {
  titulo: '', descricao: '', resolucao: '1080p',
  arquivo_url: '', tamanho_arquivo: '', thumbnail_url: '',
}

const statusCfg: Record<string, { label: string; cls: string; dot: string }> = {
  pendente:  { label: 'Pendente',  cls: 'text-[#B0B8C4] bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)]', dot: 'bg-zinc-500' },
  em_edicao: { label: 'Em edição', cls: 'text-[#D4A843] bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)]', dot: 'bg-[#D4A843] animate-pulse' },
  entregue:  { label: 'Entregue',  cls: 'text-[#D4A843] bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)]', dot: 'bg-[#D4A843]' },
  aprovado:  { label: 'Aprovado',  cls: 'text-green-400 bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.15)]',    dot: 'bg-green-400' },
  reprovado: { label: 'Reprovado', cls: 'text-red-400   bg-[rgba(239,68,68,0.08)]   border-[rgba(239,68,68,0.15)]',  dot: 'bg-red-400' },
}

function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VideosManager({ clients }: { clients: ClientItem[] }) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [savingContrato, setSavingContrato] = useState(false)

  // Contrato state
  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [totalCombinado, setTotalCombinado] = useState('')
  const [dataEntrega, setDataEntrega] = useState('')

  // Videos state
  const [videos, setVideos] = useState<VideoItem[]>([])

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null)
  const [form, setForm] = useState<VideoForm>(emptyForm)
  const [savingVideo, setSavingVideo] = useState(false)
  const [uploadMode, setUploadMode] = useState<'link' | 'upload'>('link')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState<VideoItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const supabase = createClient()

  // ── Fetch data ─────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!selectedClientId) return
    setLoading(true)
    try {
      const [contratoRes, videosRes] = await Promise.all([
        fetch(`/api/videos/contrato?clienteId=${selectedClientId}`),
        fetch(`/api/videos?clienteId=${selectedClientId}`),
      ])
      const contratoData = await contratoRes.json()
      const videosData = await videosRes.json()

      setContrato(contratoData)
      setTotalCombinado(contratoData ? String(contratoData.total_combinado) : '')
      setDataEntrega(contratoData?.data_entrega ?? '')
      setVideos(Array.isArray(videosData) ? videosData : [])
    } catch {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [selectedClientId])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Save contract ──────────────────────────────────────────────────────────

  async function handleSaveContrato() {
    if (!selectedClientId) return
    setSavingContrato(true)
    try {
      const res = await fetch('/api/videos/contrato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: selectedClientId,
          total_combinado: parseInt(totalCombinado) || 0,
          data_entrega: dataEntrega || null,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setContrato(data)
      toast.success('Contrato salvo!')
    } catch {
      toast.error('Erro ao salvar contrato')
    } finally {
      setSavingContrato(false)
    }
  }

  // ── File upload ────────────────────────────────────────────────────────────

  async function handleFileUpload(file: File) {
    setUploading(true)
    setUploadProgress(10)

    const path = `${selectedClientId}/videos/${Date.now()}_${file.name}`

    try {
      setUploadProgress(30)
      const { error } = await supabase.storage
        .from('portal-files')
        .upload(path, file, { upsert: true })

      if (error) throw error

      setUploadProgress(80)

      const { data: signedData } = await supabase.storage
        .from('portal-files')
        .createSignedUrl(path, 31536000) // 1 year

      setUploadProgress(100)

      if (signedData?.signedUrl) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
        setForm(prev => ({
          ...prev,
          arquivo_url: signedData.signedUrl,
          tamanho_arquivo: sizeMB,
        }))
        toast.success('Arquivo enviado!')
      }
    } catch {
      toast.error('Erro no upload do arquivo')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  // ── Save video ─────────────────────────────────────────────────────────────

  async function handleSaveVideo() {
    if (!form.titulo.trim()) { toast.error('Título obrigatório'); return }
    setSavingVideo(true)

    const payload = {
      cliente_id: selectedClientId,
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      resolucao: form.resolucao,
      status: 'entregue',
      arquivo_url: form.arquivo_url.trim() || null,
      tamanho_arquivo: form.tamanho_arquivo ? parseFloat(form.tamanho_arquivo) : null,
      thumbnail_url: form.thumbnail_url.trim() || null,
    }

    try {
      if (editingVideo) {
        const res = await fetch(`/api/videos/${editingVideo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        const updated = await res.json()
        setVideos(prev => prev.map(v => v.id === editingVideo.id ? updated : v))
        toast.success('Vídeo atualizado!')
      } else {
        const res = await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        const created = await res.json()
        setVideos(prev => [created, ...prev])
        toast.success('Vídeo adicionado!')
      }
      closeModal()
    } catch {
      toast.error('Erro ao salvar vídeo')
    } finally {
      setSavingVideo(false)
    }
  }

  // ── Update status inline ───────────────────────────────────────────────────

  async function handleStatusChange(video: VideoItem, newStatus: VideoItem['status']) {
    const res = await fetch(`/api/videos/${video.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const updated = await res.json()
      setVideos(prev => prev.map(v => v.id === video.id ? updated : v))
      toast.success('Status atualizado!')
    } else {
      toast.error('Erro ao atualizar status')
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    const res = await fetch(`/api/videos/${confirmDelete.id}`, { method: 'DELETE' })
    if (res.ok) {
      setVideos(prev => prev.filter(v => v.id !== confirmDelete.id))
      toast.success('Vídeo removido')
      setConfirmDelete(null)
    } else {
      toast.error('Erro ao remover vídeo')
    }
    setDeleting(false)
  }

  // ── Modal helpers ──────────────────────────────────────────────────────────

  function openAddModal() {
    setEditingVideo(null)
    setForm(emptyForm)
    setUploadMode('link')
    setShowModal(true)
  }

  function openEditModal(video: VideoItem) {
    setEditingVideo(video)
    setForm({
      titulo: video.titulo,
      descricao: video.descricao ?? '',
      resolucao: video.resolucao as '4K' | '1080p' | '720p',
      arquivo_url: video.arquivo_url ?? '',
      tamanho_arquivo: video.tamanho_arquivo ? String(video.tamanho_arquivo) : '',
      thumbnail_url: video.thumbnail_url ?? '',
    })
    setUploadMode('link')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingVideo(null)
    setForm(emptyForm)
    setUploadMode('link')
    setUploadProgress(0)
  }

  // ── Counters ───────────────────────────────────────────────────────────────

  const entregues  = videos.filter(v => v.status === 'entregue' || v.status === 'aprovado').length

  const inputCls  = 'bg-[#18181B] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)] text-sm h-9'
  const labelCls  = 'text-[#B0B8C4] text-xs'
  const selectCls = 'w-full bg-[#18181B] border border-[rgba(255,255,255,0.12)] text-white rounded-md px-2 h-9 text-sm focus:outline-none focus:border-zinc-500'

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Video className="w-6 h-6 text-[#D4A843]" />
        <div>
          <h1 className="text-2xl font-bold text-white">Edição de Vídeos</h1>
          <p className="text-[#B0B8C4] text-sm mt-0.5">Gerencie contratos e vídeos por cliente</p>
        </div>
      </div>

      {clients.length === 0 ? (
        <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
          <CardContent className="pt-6">
            <p className="text-[#B0B8C4] text-sm">
              Nenhum cliente com serviço de Edição de Vídeos ativo. Configure em{' '}
              <a href="/admin/clientes" className="text-[#D4A843] hover:underline">Clientes</a>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Client selector ─────────────────────────────────────── */}
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
            <>
              {/* ── Block 1: Contract ──────────────────────────────── */}
              <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
                <CardHeader>
                  <CardTitle className="text-white text-base">Configuração do Contrato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Total de vídeos combinados</Label>
                      <Input
                        type="number"
                        min="0"
                        value={totalCombinado}
                        onChange={e => setTotalCombinado(e.target.value)}
                        placeholder="Ex: 8"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Data de entrega</Label>
                      <Input
                        type="date"
                        value={dataEntrega}
                        min={getCurrentDate()}
                        onChange={e => setDataEntrega(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Counters summary */}
                  {videos.length > 0 && (
                    <div className="flex items-center gap-4 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                      <div className="flex items-center gap-1.5 text-xs text-[#D4A843]/70">
                        <span className="w-2 h-2 rounded-full bg-[#D4A843]" />{entregues} entregues
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveContrato}
                      disabled={savingContrato}
                      className="bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold"
                    >
                      {savingContrato
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                        : <><Save className="w-4 h-4 mr-2" />Salvar configuração</>
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ── Block 2: Videos ────────────────────────────────── */}
              <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-base">Gerenciar Vídeos</CardTitle>
                      <p className="text-[rgba(176,184,196,0.6)] text-xs mt-0.5">{videos.length} vídeo{videos.length !== 1 ? 's' : ''} cadastrado{videos.length !== 1 ? 's' : ''}</p>
                    </div>
                    <Button
                      onClick={openAddModal}
                      className="bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold h-9 text-sm"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Adicionar vídeo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {videos.length === 0 ? (
                    <div className="flex flex-col items-center py-12 gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#18181B] flex items-center justify-center">
                        <Film className="w-6 h-6 text-[rgba(176,184,196,0.4)]" />
                      </div>
                      <p className="text-[rgba(176,184,196,0.6)] text-sm">Nenhum vídeo cadastrado. Clique em &quot;Adicionar vídeo&quot;.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {videos.map(video => {
                        const cfg = statusCfg[video.status]
                        return (
                          <div key={video.id} className="flex items-center gap-3 p-3 bg-[#18181B]/50 rounded-xl border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)] transition-colors">
                            {/* Thumbnail */}
                            <div className="w-14 h-10 bg-[rgba(255,255,255,0.1)] rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                              {video.thumbnail_url
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                : <Film className="w-5 h-5 text-[rgba(176,184,196,0.6)]" />
                              }
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{video.titulo}</p>
                              <p className="text-[rgba(176,184,196,0.6)] text-xs">{video.resolucao}{video.tamanho_arquivo ? ` · ${video.tamanho_arquivo} MB` : ''}</p>
                            </div>

                            {/* Status badge */}
                            <span className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shrink-0 ${cfg.cls}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => openEditModal(video)}
                                className="w-8 h-8 flex items-center justify-center text-[#B0B8C4] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors"
                                title="Editar vídeo"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDelete(video)}
                                className="w-8 h-8 flex items-center justify-center text-[rgba(176,184,196,0.4)] hover:text-[rgba(176,184,196,0.7)] hover:bg-[rgba(255,255,255,0.04)] rounded-lg transition-colors"
                                title="Deletar vídeo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* ── Add/Edit Video Modal ─────────────────────────────────────── */}
      <Dialog open={showModal} onOpenChange={closeModal}>
        <DialogContent className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVideo ? 'Editar vídeo' : 'Adicionar vídeo'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className={labelCls}>Título *</Label>
              <Input
                value={form.titulo}
                onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                placeholder="Ex: Vídeo institucional — Versão final"
                className={inputCls}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className={labelCls}>Descrição (opcional)</Label>
              <Textarea
                value={form.descricao}
                onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                placeholder="Detalhes sobre o vídeo..."
                className="bg-[#18181B] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)] text-sm min-h-[70px]"
              />
            </div>

            {/* Resolution */}
            <div className="space-y-1.5">
              <Label className={labelCls}>Resolução</Label>
              <select
                value={form.resolucao}
                onChange={e => setForm(p => ({ ...p, resolucao: e.target.value as VideoForm['resolucao'] }))}
                className={selectCls}
              >
                <option value="4K">4K</option>
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
              </select>
            </div>

            {/* Arquivo: link ou upload */}
            <div className="space-y-2">
              <Label className={labelCls}>Arquivo do vídeo</Label>
              <div className="flex rounded-lg overflow-hidden border border-[rgba(255,255,255,0.12)]">
                <button
                  type="button"
                  onClick={() => setUploadMode('link')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors ${uploadMode === 'link' ? 'bg-[rgba(255,255,255,0.1)] text-white' : 'text-[rgba(176,184,196,0.6)] hover:text-[#D0D8E4]'}`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />Link externo
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('upload')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors ${uploadMode === 'upload' ? 'bg-[rgba(255,255,255,0.1)] text-white' : 'text-[rgba(176,184,196,0.6)] hover:text-[#D0D8E4]'}`}
                >
                  <Upload className="w-3.5 h-3.5" />Upload
                </button>
              </div>

              {uploadMode === 'link' ? (
                <div className="space-y-1.5">
                  <Input
                    type="url"
                    value={form.arquivo_url}
                    onChange={e => setForm(p => ({ ...p, arquivo_url: e.target.value }))}
                    placeholder="https://drive.google.com/... ou Dropbox..."
                    className={inputCls}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Tamanho (MB)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={form.tamanho_arquivo}
                        onChange={e => setForm(p => ({ ...p, tamanho_arquivo: e.target.value }))}
                        placeholder="Ex: 245.5"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-[rgba(255,255,255,0.12)] hover:border-zinc-500 rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                  />
                  {uploading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-[#D4A843] animate-spin" />
                      <p className="text-sm text-[#B0B8C4]">Enviando arquivo...</p>
                      <div className="w-full bg-[#18181B] rounded-full h-1.5">
                        <div
                          className="bg-[#D4A843] h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </>
                  ) : form.arquivo_url ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-[#D4A843]" />
                      <p className="text-sm text-[#D4A843] font-medium">Arquivo enviado!</p>
                      {form.tamanho_arquivo && (
                        <p className="text-xs text-[rgba(176,184,196,0.6)]">{form.tamanho_arquivo} MB</p>
                      )}
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-[rgba(176,184,196,0.6)]" />
                      <div className="text-center">
                        <p className="text-sm text-[#B0B8C4]">Arraste ou clique para fazer upload</p>
                        <p className="text-xs text-[rgba(176,184,196,0.4)] mt-1">MP4, MOV, AVI — até 500 MB</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Thumbnail */}
            <div className="space-y-1.5">
              <Label className={labelCls}>URL da thumbnail (opcional)</Label>
              <Input
                type="url"
                value={form.thumbnail_url}
                onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))}
                placeholder="https://..."
                className={inputCls}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" className="border-[rgba(255,255,255,0.12)] text-[#D0D8E4]" onClick={closeModal}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveVideo}
                disabled={savingVideo || uploading}
                className="bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold"
              >
                {savingVideo
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                  : <><Clock className="w-4 h-4 mr-2" />{editingVideo ? 'Atualizar' : 'Salvar vídeo'}</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm modal ─────────────────────────────────────── */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[rgba(176,184,196,0.7)]">
              <AlertTriangle className="w-5 h-5" />
              Confirmar exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <p className="text-[#D0D8E4] text-sm">
              Tem certeza que deseja remover{' '}
              <span className="text-white font-semibold">&quot;{confirmDelete?.titulo}&quot;</span>?
              Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="border-[rgba(255,255,255,0.12)] text-[#D0D8E4]" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)] text-white"
              >
                {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Removendo...</> : <><Trash2 className="w-4 h-4 mr-2" />Remover</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
