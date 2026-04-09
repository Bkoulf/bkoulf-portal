export type UserRole = 'admin' | 'client'

export type ServiceType =
  | 'trafego_pago'
  | 'edicao_videos'
  | 'identidade_visual'
  | 'website'

export type ServiceStatus = 'ativo' | 'pausado' | 'concluido' | 'pendente'

export type DeliverableStatus =
  | 'aguardando_aprovacao'
  | 'aprovado'
  | 'ajuste_solicitado'
  | 'entregue'

export type DemandStatus =
  | 'aberta'
  | 'em_andamento'
  | 'concluida'
  | 'cancelada'

export type DemandPriority = 'baixa' | 'media' | 'alta' | 'urgente'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url?: string
  client_id?: string
  created_at: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  plan?: string
  status: 'ativo' | 'inativo'
  created_at: string
}

export interface Service {
  id: string
  client_id: string
  type: ServiceType
  status: ServiceStatus
  description?: string
  start_date?: string
  end_date?: string
  created_at: string
}

export interface Deliverable {
  id: string
  service_id: string
  client_id: string
  title: string
  description?: string
  status: DeliverableStatus
  file_url?: string
  feedback?: string
  due_date?: string
  created_at: string
}

export interface Demand {
  id: string
  client_id: string
  service_id?: string
  title: string
  description: string
  status: DemandStatus
  priority: DemandPriority
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  client_id: string
  sender_id: string
  sender_name: string
  content: string
  is_from_agency: boolean
  read: boolean
  created_at: string
}

export interface CalendarEvent {
  id: string
  client_id: string
  title: string
  description?: string
  event_date: string
  type: 'entrega' | 'reuniao' | 'publicacao' | 'outro'
  created_at: string
}

export interface BK4Diagnostic {
  id: string
  client_id: string
  score: number
  identity_score: number
  audiovisual_score: number
  digital_score: number
  conversion_score: number
  problems: string[]
  opportunities: string[]
  notes?: string
  created_at: string
}

export interface Report {
  id: string
  client_id: string
  service_type: ServiceType
  period: string
  title: string
  data: Record<string, unknown>
  file_url?: string
  created_at: string
}

export interface FileUpload {
  id: string
  client_id: string
  name: string
  url: string
  size: number
  type: string
  category: 'entrega' | 'material_cliente' | 'relatorio' | 'outro'
  uploaded_by: string
  created_at: string
}
