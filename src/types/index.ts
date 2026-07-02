export type ApplicationStatus = 'draft' | 'sent' | 'interview' | 'rejected' | 'accepted'

export interface Application {
  id: string
  company: string
  role: string
  status: ApplicationStatus
  appliedDate: string | null
  url: string
  notes: string
  contactId: string | null
  createdAt: string
  updatedAt: string
}

export interface Contact {
  id: string
  name: string
  company: string
  role: string
  email: string
  linkedin: string
  notes: string
  createdAt: string
}

export type InterviewType = 'phone' | 'video' | 'onsite' | 'technical' | 'other'

export interface InterviewNote {
  id: string
  applicationId: string | null
  company: string
  date: string
  type: InterviewType
  questions: string
  myAnswers: string
  feedback: string
  outcome: string
  notes: string
}

export interface AppState {
  applications: Application[]
  contacts: Contact[]
  interviewNotes: InterviewNote[]
}
