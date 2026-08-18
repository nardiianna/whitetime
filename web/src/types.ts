export type PostStatus = 'idea' | 'da_fare' | 'programmato' | 'promemoria_inviato' | 'pubblicato'
export type PageType = 'client' | 'personal'

export const STATUS_LABELS: Record<PostStatus, string> = {
  idea: 'Idea',
  da_fare: 'Da fare',
  programmato: 'Programmato',
  promemoria_inviato: 'Promemoria inviato',
  pubblicato: 'Pubblicato',
}

export function statusLabel(status: PostStatus, isPersonal: boolean) {
  if (isPersonal && status === 'pubblicato') return 'Fatto'
  return STATUS_LABELS[status]
}

export interface Page {
  id: string
  name: string
  type: PageType
  instagram_username: string | null
  notes: string | null
}

export interface Category {
  id: string
  page_id: string
  name: string
}

export interface Post {
  id: string
  page_id: string
  category_id: string | null
  caption: string
  media_paths: string[]
  scheduled_at: string
  status: PostStatus
  reminder_sent: boolean
  reminder_error: string | null
  notes: string | null
  created_at: string
  category?: { name: string } | null
  page?: { name: string; type: PageType } | null
}

export interface ContentIdea {
  id: string
  page_id: string
  idea_text: string
  pillar: string | null
  used: boolean
}

export type UserRole = 'admin' | 'client'

export interface Profile {
  id: string
  role: UserRole
  page_id: string | null
}

export type EditorialStatus = 'idea' | 'da_fare' | 'programmato' | 'pubblicato'

export const EDITORIAL_STATUS_LABELS: Record<EditorialStatus, string> = {
  idea: 'Idea',
  da_fare: 'Da fare',
  programmato: 'Programmato',
  pubblicato: 'Pubblicato',
}

export interface EditorialPlanItem {
  id: string
  page_id: string
  scheduled_date: string | null
  status: EditorialStatus
  social: string[]
  theme: string | null
  format: string | null
  title: string | null
  caption: string | null
  image_url: string | null
  image_path: string | null
  internal_note: string | null
  client_note: string | null
  approved: boolean
  created_at: string
  updated_at: string
}

export interface CustomMetric {
  label: string
  value: number | null
}

export interface AdReport {
  id: string
  page_id: string
  campaign_name: string
  period_start: string | null
  period_end: string | null
  campaign_objective: string | null
  spend: number | null
  custom_metrics: CustomMetric[]
  screenshot_path: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
