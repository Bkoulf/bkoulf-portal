import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Proxy do HTML do brandbook para renderização same-origin (permite auto-resize do iframe)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('client_id, role').eq('id', user.id).single()

  if (profile?.role !== 'admin' && profile?.client_id !== clienteId) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { data: iv } = await supabase
    .from('identidade_visual')
    .select('arquivo_url')
    .eq('cliente_id', clienteId)
    .single()

  if (!iv?.arquivo_url) return new NextResponse('Not found', { status: 404 })

  const res = await fetch(iv.arquivo_url)
  if (!res.ok) return new NextResponse('Failed to fetch brandbook', { status: 502 })

  let html = await res.text()

  // Injeta script que informa a altura do conteúdo ao parent via postMessage
  const script = `<script>
(function(){
  function sendH(){window.parent.postMessage({iframeHeight:document.documentElement.scrollHeight},'*');}
  window.addEventListener('load', sendH);
  new ResizeObserver(sendH).observe(document.documentElement);
})();
</script>`

  html = html.includes('</body>')
    ? html.replace('</body>', script + '</body>')
    : html + script

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
