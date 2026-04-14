'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserCircle, Loader2, Camera, ShieldCheck, ArrowRightLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminPerfilPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      setEmail(user.email ?? '')
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()
      setFullName(profile?.full_name ?? '')
      setAvatarUrl(profile?.avatar_url ?? null)
      setLoading(false)
    }
    load()
  }, [])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${userId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('portal-files')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('portal-files')
        .getPublicUrl(path)

      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      toast.success('Foto atualizada!')
    } catch {
      toast.error('Erro ao enviar foto')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) { toast.error('Digite seu nome completo'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', user!.id)
    if (error) toast.error('Erro ao salvar.')
    else toast.success('Nome atualizado!')
    setSaving(false)
  }

  const initials = fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'

  return (
    <div className="space-y-6 max-w-lg">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(212,168,67,0.1)' }}>
          <UserCircle className="w-5 h-5 text-[#D4A843]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Meu Perfil</h1>
          <p className="text-[#B0B8C4] text-xs mt-0.5">Informações da conta administradora</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)' }}>
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4A843]" />
          <span className="text-[#D4A843] text-xs font-medium">Admin</span>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Avatar */}
        <div className="p-6 flex items-center gap-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="relative shrink-0">
            <Avatar className="w-20 h-20">
              <AvatarImage src={avatarUrl ?? undefined} className="object-cover" />
              <AvatarFallback className="text-xl font-bold" style={{ background: 'rgba(212,168,67,0.15)', color: '#D4A843' }}>
                {loading ? '?' : initials}
              </AvatarFallback>
            </Avatar>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ background: '#D4A843', boxShadow: '0 0 0 2px #050A14' }}
            >
              {uploading
                ? <Loader2 className="w-3.5 h-3.5 text-[#050A14] animate-spin" />
                : <Camera className="w-3.5 h-3.5 text-[#050A14]" />
              }
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture={undefined}
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div>
            <p className="text-white font-semibold text-lg">{loading ? '...' : fullName || 'Sem nome'}</p>
            <p className="text-[#B0B8C4] text-sm">{email}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs text-[#D4A843] hover:text-[#e8bb50] mt-1 transition-colors"
            >
              {uploading ? 'Enviando...' : 'Alterar foto'}
            </button>
            <p className="text-[10px] text-[rgba(176,184,196,0.35)] mt-0.5">Câmera, galeria ou arquivo</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center gap-2 text-[#B0B8C4] text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#B0B8C4] tracking-wide uppercase">Nome completo</label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-[rgba(176,184,196,0.35)] outline-none transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D4A843'
                    e.target.style.boxShadow = '0 0 0 3px rgba(212,168,67,0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#B0B8C4] tracking-wide uppercase">Email</label>
                <input
                  value={email}
                  disabled
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none cursor-not-allowed"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(176,184,196,0.5)' }}
                />
                <p className="text-xs text-[rgba(176,184,196,0.4)]">O email não pode ser alterado</p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-lg text-sm font-bold tracking-wide uppercase transition-all"
                style={{ background: saving ? 'rgba(212,168,67,0.5)' : '#D4A843', color: '#050A14' }}
              >
                {saving ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Salvando...</span> : 'Salvar alterações'}
              </button>
            </form>
          )}
        </div>
      </div>
      {/* Trocar de conta */}
      <div
        className="flex items-center justify-between gap-4 p-5 rounded-2xl"
        style={{ background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.15)' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(212,168,67,0.12)' }}
          >
            <ArrowRightLeft className="w-4 h-4 text-[#D4A843]" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Trocar de conta</p>
            <p className="text-[rgba(176,184,196,0.6)] text-xs mt-0.5">Acessar o portal do cliente com sua conta.</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/portal/dashboard')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 whitespace-nowrap hover:opacity-90 active:scale-95"
          style={{ background: 'rgba(212,168,67,0.15)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.25)' }}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Ir para o portal
        </button>
      </div>

    </div>
  )
}
