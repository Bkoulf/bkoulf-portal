'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowRight, ArrowLeft, Shield } from 'lucide-react'

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function ClientForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou senha inválidos')
      setLoading(false)
      return
    }

    window.location.replace('/portal/dashboard')
  }

  return (
    <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
      <h2 className="text-white text-xl font-bold mb-1">Entrar</h2>
      <p className="text-[#B0B8C4] text-sm mb-6">Acesse sua conta para acompanhar seus serviços</p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-400 bg-red-500/10 border border-red-500/20">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#B0B8C4] tracking-wide uppercase">Email</label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
            className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-[rgba(176,184,196,0.35)] outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#B0B8C4] tracking-wide uppercase">Senha</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-[rgba(176,184,196,0.35)] outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg text-sm font-bold tracking-widest uppercase text-white mt-2"
          style={{ background: loading ? 'rgba(45,125,210,0.5)' : '#2D7DD2' }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <a
          href="https://wa.me/5511999999999"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full pt-2 text-xs text-[rgba(176,184,196,0.45)] hover:text-[rgba(176,184,196,0.75)] transition-colors"
        >
          Esqueci o login <ArrowRight className="w-3 h-3" />
        </a>
      </form>

      <a
        href="/login?modo=admin"
        className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-[#D4A843] mt-3"
      >
        Acesso Admin <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  )
}

function AdminForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciais inválidas')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut()
      setError('Acesso restrito a administradores')
      setLoading(false)
      return
    }

    window.location.replace('/admin')
  }

  return (
    <div className="rounded-2xl p-8" style={{ background: 'rgba(212,168,67,0.03)', border: '1px solid rgba(212,168,67,0.2)', backdropFilter: 'blur(16px)' }}>
      <div className="flex items-center gap-3 mb-1">
        <Shield className="w-5 h-5 text-[#D4A843]" />
        <h2 className="text-white text-xl font-bold">Acesso Admin</h2>
      </div>
      <p className="text-[#B0B8C4] text-sm mb-6">Área restrita — apenas administradores autorizados</p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-400 bg-red-500/10 border border-red-500/20">
          {error}
        </div>
      )}

      <form onSubmit={handleAdminLogin} className="space-y-4" autoComplete="off">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#B0B8C4] tracking-wide uppercase">Email</label>
          <input
            type="email"
            placeholder="admin@bkoulf.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
            className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-[rgba(176,184,196,0.35)] outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,168,67,0.2)' }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#B0B8C4] tracking-wide uppercase">Senha</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-[rgba(176,184,196,0.35)] outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,168,67,0.2)' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg text-sm font-bold tracking-widest uppercase mt-2"
          style={{ background: loading ? 'rgba(212,168,67,0.5)' : '#D4A843', color: '#050A14' }}
        >
          {loading ? 'Verificando...' : 'Entrar como Admin'}
        </button>

        <a
          href="https://wa.me/5511999999999"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full pt-2 text-xs text-[rgba(176,184,196,0.45)] hover:text-[rgba(176,184,196,0.75)] transition-colors"
        >
          Esqueci o login <ArrowRight className="w-3 h-3" />
        </a>
      </form>

      <a href="/login" className="flex items-center gap-2 py-3 text-sm font-medium text-[#B0B8C4] mt-2">
        <ArrowLeft className="w-4 h-4" /> Voltar ao login
      </a>
    </div>
  )
}

function LoginContent() {
  const searchParams = useSearchParams()
  const isAdmin = searchParams.get('modo') === 'admin'

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#000000' }}>
      <div className="w-full max-w-5xl relative z-10 flex flex-col items-center lg:flex-row lg:items-center lg:gap-12">

        {/* Logo desktop */}
        <div className="hidden lg:flex lg:w-2/5 flex-col items-center justify-center">
          <Image src="/logo-full.jpg" alt="Bkoulf" width={360} height={144} className="object-contain w-80" style={{ mixBlendMode: 'screen' }} priority />
        </div>

        <div className="w-full max-w-sm lg:max-w-none lg:w-3/5">
          {/* Logo mobile */}
          <div className="flex justify-center mb-4 lg:hidden">
            <Image src="/logo-full.jpg" alt="Bkoulf" width={280} height={112} className="object-contain" style={{ mixBlendMode: 'screen' }} priority />
          </div>

          {isAdmin ? <AdminForm /> : <ClientForm />}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginContent />
    </Suspense>
  )
}
