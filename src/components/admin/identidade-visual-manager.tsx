'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Palette, Loader2, Upload, CheckCircle2, Trash2,
  AlertTriangle, RefreshCw, FileCode, Calendar,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClientItem { id: string; name: string; company?: string }

interface IdentidadeVisual {
  id: string
  cliente_id: string
  arquivo_url: string | null
  nome_arquivo: string | null
  status: 'em_producao' | 'entregue'
  entregue_em: string | null
  criado_em: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function IdentidadeVisualManager({ clients }: { clients: ClientItem[] }) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [identidade, setIdentidade] = useState<IdentidadeVisual | null>(null)

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const selectCls = 'w-full bg-[#1C2333] border border-[rgba(255,255,255,0.12)] text-white rounded-md px-2 h-9 text-sm focus:outline-none focus:border-zinc-500'
  const labelCls = 'text-[#B0B8C4] text-xs'

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!selectedClientId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/identidade-visual?clienteId=${selectedClientId}`)
      const data = await res.json()
      setIdentidade(data)
    } catch {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [selectedClientId])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Upload ────────────────────────────────────────────────────────────────

  async function handleUpload(file: File) {
    if (!file.name.endsWith('.html')) {
      toast.error('Apenas arquivos .html são aceitos')
      return
    }

    setUploading(true)
    setUploadProgress(10)

    const path = `${selectedClientId}/identidade-visual/${Date.now()}_${file.name}`

    try {
      setUploadProgress(25)

      const { error: uploadError } = await supabase.storage
        .from('portal-files')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      setUploadProgress(65)

      const { data: signedData } = await supabase.storage
        .from('portal-files')
        .createSignedUrl(path, 31536000) // 1 ano

      if (!signedData?.signedUrl) throw new Error('Falha ao gerar URL')

      setUploadProgress(85)

      const res = await fetch('/api/identidade-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: selectedClientId,
          arquivo_url: signedData.signedUrl,
          nome_arquivo: file.name,
        }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody?.error ?? `HTTP ${res.status}`)
      }

      setUploadProgress(100)
      const saved = await res.json()
      setIdentidade(saved)
      toast.success('Brandbook enviado com sucesso!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Upload error:', err)
      toast.error(`Erro: ${msg}`)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/identidade-visual/${selectedClientId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setIdentidade(null)
      toast.success('Brandbook removido')
      setConfirmDelete(false)
    } catch {
      toast.error('Erro ao remover brandbook')
    } finally {
      setDeleting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const temArquivo = !!(identidade?.arquivo_url)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Palette className="w-6 h-6 text-[#D4A843]" />
        <div>
          <h1 className="text-2xl font-bold text-white">Identidade Visual</h1>
          <p className="text-[#B0B8C4] text-sm mt-0.5">Gerencie o brandbook por cliente</p>
        </div>
      </div>

      {clients.length === 0 ? (
        <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
          <CardContent className="pt-6">
            <p className="text-[#B0B8C4] text-sm">
              Nenhum cliente com serviço de Identidade Visual ativo. Configure em{' '}
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
            <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base">Brandbook HTML</CardTitle>
                  {temArquivo && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4A843]" />
                      <span className="text-[#D4A843] text-xs font-medium">Entregue</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Arquivo já existe */}
                {temArquivo && (
                  <div className="flex items-center gap-4 p-4 bg-[#1C2333]/50 border border-[rgba(255,255,255,0.12)] rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,0.05)] flex items-center justify-center shrink-0">
                      <FileCode className="w-5 h-5 text-[#D4A843]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {identidade!.nome_arquivo ?? 'brandbook.html'}
                      </p>
                      {identidade!.entregue_em && (
                        <p className="text-[rgba(176,184,196,0.6)] text-xs mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          Entregue em {new Date(identidade!.entregue_em).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'long', year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Zona de upload */}
                <div>
                  {temArquivo && (
                    <p className="text-[rgba(176,184,196,0.6)] text-xs mb-2">
                      {temArquivo ? 'Substituir arquivo:' : 'Fazer upload:'}
                    </p>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".html"
                    className="hidden"
                    onChange={onFileChange}
                  />

                  <div
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200
                      ${isDragging
                        ? 'border-[#D4A843] bg-[rgba(255,255,255,0.05)]'
                        : 'border-[rgba(255,255,255,0.12)] hover:border-zinc-500 hover:bg-[#1C2333]/30'
                      }
                      ${uploading ? 'pointer-events-none' : ''}
                    `}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-10 h-10 text-[#D4A843] animate-spin" />
                        <p className="text-sm text-[#D0D8E4] font-medium">Enviando brandbook...</p>
                        <div className="w-full max-w-xs bg-[#1C2333] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#D4A843] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-[rgba(176,184,196,0.6)]">{uploadProgress}%</p>
                      </>
                    ) : (
                      <>
                        {temArquivo
                          ? <RefreshCw className="w-10 h-10 text-[rgba(176,184,196,0.6)]" />
                          : <Upload className="w-10 h-10 text-[rgba(176,184,196,0.6)]" />
                        }
                        <div className="text-center">
                          <p className="text-sm text-[#D0D8E4] font-medium">
                            {temArquivo ? 'Arraste ou clique para substituir' : 'Arraste ou clique para fazer upload'}
                          </p>
                          <p className="text-xs text-[rgba(176,184,196,0.4)] mt-1">Apenas arquivos .html</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Ações */}
                {temArquivo && (
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmDelete(true)}
                      className="text-[rgba(176,184,196,0.7)] hover:text-[rgba(176,184,196,0.7)] hover:bg-[rgba(255,255,255,0.04)] text-sm h-9"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir brandbook
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Modal confirmação de exclusão */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[rgba(176,184,196,0.7)]">
              <AlertTriangle className="w-5 h-5" />
              Confirmar exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <p className="text-[#D0D8E4] text-sm">
              Tem certeza que deseja remover o brandbook de{' '}
              <span className="text-white font-semibold">
                {clients.find(c => c.id === selectedClientId)?.name}
              </span>?
              O cliente perderá acesso ao arquivo.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="border-[rgba(255,255,255,0.12)] text-[#D0D8E4]"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)] text-white"
              >
                {deleting
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Removendo...</>
                  : <><Trash2 className="w-4 h-4 mr-2" />Remover</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
