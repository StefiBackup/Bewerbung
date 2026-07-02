import type { ApplicationStatus, InterviewType } from '../types'

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Entwurf',
  sent: 'Gesendet',
  interview: 'Gespräch',
  rejected: 'Absage',
  accepted: 'Zusage',
}

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft: 'bg-slate-500/20 text-slate-400 border-slate-600',
  sent: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  interview: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/40',
  accepted: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
}

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  phone: 'Telefon',
  video: 'Video',
  onsite: 'Vor Ort',
  technical: 'Technisch',
  other: 'Sonstiges',
}
