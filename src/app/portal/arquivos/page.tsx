'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  FolderOpen, Upload, Download, Loader2, Trash2,
  Image as ImageIcon, Film, FileText, File, X, AlertTriangle,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Arquivos',
}


// ─── Types ───────────────────────────────────────────────────────────────────

interface FileItem {
  id: string
  name: string
  url: string
  size: number
  type: string
  created_at: string
  client_id: string
  uploaded_by: string
  category: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return { Icon: ImageIcon, color: 'text-[#2D7DD2]', bg: 'bg-[rgba(45,125,210,0.1)]' }
  if (type.startsWith('video/')) return { Icon: Film, color: 'text-[#2D7DD2]', bg: 'bg-[rgba(45,125,210,0.1)]' }
  if (type === 'application/pdf') return { Icon: FileText, color: 'text-[#B0B8C4]', bg: 'bg-[rgba(255,255,255,0.05)]' }
  return { Icon: File, color: 'text-[#B0B8C4]', bg: 'bg-zinc-700' }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── File Card ────────────────────────────────────────────────────────────────

function FileCard({ file, onDelete }: { file: FileItem; onDelete: (f: FileItem) => void }) {
  const { Icon, color, bg } = getFileIcon(file.type)
  const isImage = file.type.startsWith('image/')

  return (
    <div className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all duration-200">
      {/* Preview para imagens */}
      {isImage ? (
        <div className="relative w-full aspect-video bg-zinc-800 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={file.url}
            alt={file.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <button
            onClick={() => onDelete(file)}
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-red-600/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className={`relative w-full aspect-video ${bg} flex items-center justify-center`}>
          <Icon className={`w-10 h-10 ${color}`} />
          <button
            onClick={() => onDelete(file)}
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-red-600/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Info + download */}
      <div className="p-3">
        <p className="text-white text-xs font-medium truncate">{file.name}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-zinc-600 text-xs">{formatSize(file.size)} · {formatDate(file.created_at)}</span>
          <a
            href={file.url}
            download={file.name}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ArquivosPage() {
  const [files, setFiles]           = useState<FileItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [uploading, setUploading]   = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [clientId, setClientId]     = useState<string | null>(null)
  const [userId, setUserId]         = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null)
  const [deleting, setDeleting]     = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: profile } = await supabase
      .from('profiles').select('client_id').eq('id', user.id).single()
    const cid = profile?.client_id
    setClientId(cid ?? null)

    const { data } = await supabase
      .from('files')
      .select('*')
      .eq('client_id', cid ?? '')
      .order('created_at', { ascending: false })

    setFiles((data as FileItem[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Upload ────────────────────────────────────────────────────────────────

  async function handleUpload(file: File) {
    if (!clientId || !userId) return

    setUploading(true)
    setUploadProgress(10)

    const path = `${clientId}/arquivos/${Date.now()}_${file.name}`

    try {
      setUploadProgress(30)

      const { error: uploadError } = await supabase.storage
        .from('portal-files')
        .upload(path, file, { upsert: false })

      if (uploadError) throw uploadError

      setUploadProgress(70)

      const { data: signedData } = await supabase.storage
        .from('portal-files')
        .createSignedUrl(path, 31536000)

      if (!signedData?.signedUrl) throw new Error('Falha ao gerar URL')

      setUploadProgress(90)

      const { data: newFile, error: dbError } = await supabase
        .from('files')
        .insert({
          client_id: clientId,
          name: file.name,
          url: signedData.signedUrl,
          size: file.size,
          type: file.type,
          category: 'material_cliente',
          uploaded_by: userId,
        })
        .select()
        .single()

      if (dbError) throw dbError

      setUploadProgress(100)
      setFiles(prev => [newFile as FileItem, ...prev])
      toast.success('Arquivo enviado!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao enviar arquivo')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('files').delete().eq('id', deleteTarget.id)

      if (error) throw error

      setFiles(prev => prev.filter(f => f.id !== deleteTarget.id))
      toast.success('Arquivo removido')
      setDeleteTarget(null)
    } catch {
      toast.error('Erro ao remover arquivo')
    } finally {
      setDeleting(false)
    }
  }

  // ── Filters ───────────────────────────────────────────────────────────────

  const imagens = files.filter(f => f.type.startsWith('image/'))
  const videos  = files.filter(f => f.type.startsWith('video/'))
  const outros  = files.filter(f => !f.type.startsWith('image/') && !f.type.startsWith('video/'))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(45,125,210,0.1)] flex items-center justify-center shrink-0">
            <FolderOpen className="w-5 h-5 text-[#2D7DD2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Arquivos</h1>
            <p className="text-zinc-500 text-xs mt-0.5">
              {loading ? 'Carregando...' : `${files.length} arquivo${files.length !== 1 ? 's' : ''} enviado${files.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-white text-zinc-950 hover:bg-zinc-200 font-semibold shrink-0"
        >
          {uploading
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
            : <><Upload className="w-4 h-4 mr-2" />Enviar arquivo</>
          }
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.zip,.rar,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {/* Zona de drag & drop / progresso */}
      <div
        className={`border-2 border-dashed rounded-xl transition-all duration-200 ${
          isDragging
            ? 'border-white/40 bg-white/5 scale-[1.01]'
            : 'border-zinc-700 hover:border-zinc-600'
        }`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3 py-8 cursor-default">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-zinc-300 text-sm font-medium">Enviando arquivo...</p>
            <div className="w-48 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-white h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-zinc-500 text-xs">{uploadProgress}%</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 cursor-pointer">
            <Upload className="w-7 h-7 text-zinc-500" />
            <p className="text-[#B0B8C4] text-sm">
              {isDragging ? 'Solte o arquivo aqui' : 'Arraste ou clique para enviar'}
            </p>
            <p className="text-zinc-600 text-xs">Imagens, vídeos e documentos em alta qualidade</p>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center gap-2 text-[#B0B8C4] text-sm py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />Carregando arquivos...
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
            <FolderOpen className="w-7 h-7 text-zinc-600" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-sm">Nenhum arquivo enviado ainda</p>
            <p className="text-zinc-500 text-xs mt-1 max-w-xs">
              Envie imagens, vídeos e documentos em alta qualidade para a equipe Bkoulf usar nos seus projetos.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Imagens */}
          {imagens.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-4 h-4 text-[#2D7DD2]" />
                <h2 className="text-white font-semibold text-sm">Imagens</h2>
                <span className="text-zinc-600 text-xs">{imagens.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {imagens.map(f => <FileCard key={f.id} file={f} onDelete={setDeleteTarget} />)}
              </div>
            </section>
          )}

          {/* Vídeos */}
          {videos.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Film className="w-4 h-4 text-[#2D7DD2]" />
                <h2 className="text-white font-semibold text-sm">Vídeos</h2>
                <span className="text-zinc-600 text-xs">{videos.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {videos.map(f => <FileCard key={f.id} file={f} onDelete={setDeleteTarget} />)}
              </div>
            </section>
          )}

          {/* Outros */}
          {outros.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <File className="w-4 h-4 text-[#B0B8C4]" />
                <h2 className="text-white font-semibold text-sm">Documentos</h2>
                <span className="text-zinc-600 text-xs">{outros.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {outros.map(f => <FileCard key={f.id} file={f} onDelete={setDeleteTarget} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#B0B8C4]">
              <AlertTriangle className="w-5 h-5" />
              Remover arquivo
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <p className="text-zinc-300 text-sm">
              Deseja remover <span className="text-white font-semibold">&quot;{deleteTarget?.name}&quot;</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="border-zinc-700 text-zinc-300" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </Button>
              <Button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
                {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Removendo...</> : <><X className="w-4 h-4 mr-2" />Remover</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
