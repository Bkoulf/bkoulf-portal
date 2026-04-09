'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle, AlertCircle, Clock, Download, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import type { Deliverable } from '@/lib/types'

const statusConfig = {
  aguardando_aprovacao: { label: 'Aguardando aprovação', color: 'bg-[rgba(255,255,255,0.05)] text-[#B0B8C4] border-[rgba(255,255,255,0.08)]' },
  aprovado: { label: 'Aprovado', color: 'bg-[rgba(255,255,255,0.05)] text-[#D4A843] border-[rgba(255,255,255,0.08)]' },
  ajuste_solicitado: { label: 'Ajuste solicitado', color: 'bg-[rgba(255,255,255,0.05)] text-[#B0B8C4] border-[rgba(255,255,255,0.08)]' },
  entregue: { label: 'Entregue', color: 'bg-[rgba(255,255,255,0.05)] text-[#D4A843] border-[rgba(255,255,255,0.08)]' },
}

interface DeliverablesListProps {
  deliverables: Deliverable[]
  title?: string
}

export function DeliverablesList({ deliverables, title = 'Entregas' }: DeliverablesListProps) {
  const [items, setItems] = useState(deliverables)
  const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; id: string; action: 'aprovado' | 'ajuste_solicitado' } | null>(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleAction() {
    if (!feedbackDialog) return
    setLoading(true)

    const updates: Partial<Deliverable> = { status: feedbackDialog.action }
    if (feedback.trim()) updates.feedback = feedback

    const { error } = await supabase
      .from('deliverables')
      .update(updates)
      .eq('id', feedbackDialog.id)

    if (error) {
      toast.error('Erro ao atualizar. Tente novamente.')
      setLoading(false)
      return
    }

    setItems(prev =>
      prev.map(item =>
        item.id === feedbackDialog.id
          ? { ...item, status: feedbackDialog.action, feedback: feedback || item.feedback }
          : item
      )
    )

    toast.success(
      feedbackDialog.action === 'aprovado' ? 'Entrega aprovada!' : 'Ajuste solicitado!'
    )
    setFeedbackDialog(null)
    setFeedback('')
    setLoading(false)
  }

  return (
    <>
      <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
        <CardHeader>
          <CardTitle className="text-white text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-[rgba(176,184,196,0.6)] text-sm">Nenhuma entrega registrada ainda.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const config = statusConfig[item.status]
                const canAct = item.status === 'aguardando_aprovacao'

                return (
                  <li key={item.id} className="p-4 bg-[#1C2333] rounded-lg space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-[#B0B8C4] mt-1">{item.description}</p>
                        )}
                        {item.due_date && (
                          <p className="text-xs text-[rgba(176,184,196,0.6)] mt-1">
                            Prazo: {new Date(item.due_date).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium shrink-0 ${config.color}`}>
                        {config.label}
                      </span>
                    </div>

                    {item.feedback && (
                      <div className="flex items-start gap-2 text-xs text-[#B0B8C4] bg-[rgba(255,255,255,0.1)]/50 rounded p-2">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{item.feedback}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {item.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs bg-transparent border-[rgba(255,255,255,0.12)] text-[#D0D8E4] hover:bg-[rgba(255,255,255,0.1)]"
                          onClick={() => window.open(item.file_url!, '_blank')}
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Ver arquivo
                        </Button>
                      )}
                      {canAct && (
                        <>
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-[#D4A843] hover:bg-[#D4A843] text-white"
                            onClick={() => setFeedbackDialog({ open: true, id: item.id, action: 'aprovado' })}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-[rgba(255,255,255,0.1)] text-[#B0B8C4] hover:bg-[rgba(255,255,255,0.05)]"
                            onClick={() => setFeedbackDialog({ open: true, id: item.id, action: 'ajuste_solicitado' })}
                          >
                            <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                            Solicitar ajuste
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={feedbackDialog?.open ?? false}
        onOpenChange={() => { setFeedbackDialog(null); setFeedback('') }}
      >
        <DialogContent className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white">
          <DialogHeader>
            <DialogTitle>
              {feedbackDialog?.action === 'aprovado' ? 'Aprovar entrega' : 'Solicitar ajuste'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Textarea
              placeholder={
                feedbackDialog?.action === 'aprovado'
                  ? 'Deixe um comentário (opcional)'
                  : 'Descreva o que precisa ser ajustado...'
              }
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="bg-[#1C2333] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)] min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="border-[rgba(255,255,255,0.12)] text-[#D0D8E4]"
                onClick={() => { setFeedbackDialog(null); setFeedback('') }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAction}
                disabled={loading || (feedbackDialog?.action === 'ajuste_solicitado' && !feedback.trim())}
                className={feedbackDialog?.action === 'aprovado'
                  ? 'bg-[#D4A843] hover:bg-[#D4A843]'
                  : 'bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.06)]'
                }
              >
                {loading ? 'Salvando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
