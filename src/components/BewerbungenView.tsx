import { useRef, useState } from 'react'
import type { Application, ApplicationStatus, Contact, InterviewNote, InterviewType } from '../types'
import { useStore } from '../hooks/useStore'
import type { AuthUser } from '../utils/api'
import { TextInput, TextArea, SaveButton, SearchInput } from './ui'
import { AdminPanel } from './AdminPanel'
import {
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
} from '../utils/career'

type Tab = 'applications' | 'contacts' | 'interviews' | 'admin'

interface BewerbungenViewProps {
  user: AuthUser
  onLogout: () => void
}

export function BewerbungenView({ user, onLogout }: BewerbungenViewProps) {
  const [tab, setTab] = useState<Tab>('applications')
  const { state, loading, exportBackup, restoreBackup } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const stats = {
    total: state.applications.length,
    sent: state.applications.filter((a) => a.status === 'sent').length,
    interview: state.applications.filter((a) => a.status === 'interview').length,
    accepted: state.applications.filter((a) => a.status === 'accepted').length,
    rejected: state.applications.filter((a) => a.status === 'rejected').length,
  }

  const handleImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') restoreBackup(reader.result)
    }
    reader.readAsText(file)
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        Deine Daten werden geladen…
      </div>
    )
  }

  const tabs: Array<{ id: Tab; label: string; icon: string; adminOnly?: boolean }> = [
    { id: 'applications', label: 'Bewerbungen', icon: '📨' },
    { id: 'contacts', label: 'Kontakte', icon: '👤' },
    { id: 'interviews', label: 'Interviews', icon: '🎤' },
    { id: 'admin', label: 'Admin', icon: '⚙️', adminOnly: true },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Bewerbungen</h1>
          <p className="text-sm text-slate-400 mt-1">
            Angemeldet als <span className="text-slate-300">{user.username}</span>
            {user.role === 'admin' && <span className="text-amber-400"> · Admin</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportBackup}
            className="text-sm px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
          >
            Import
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="text-sm px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-red-300 hover:border-red-500/50"
          >
            Abmelden
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImport(file)
              e.target.value = ''
            }}
          />
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MiniStat label="Gesamt" value={stats.total} />
        <MiniStat label="Gesendet" value={stats.sent} color="text-blue-400" />
        <MiniStat label="Gespräch" value={stats.interview} color="text-amber-400" />
        <MiniStat label="Zusage" value={stats.accepted} color="text-emerald-400" />
        <MiniStat label="Absage" value={stats.rejected} color="text-red-400" />
      </div>

      <div className="flex gap-1 border-b border-slate-800 overflow-x-auto">
        {tabs
          .filter((t) => !t.adminOnly || user.role === 'admin')
          .map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'applications' && <ApplicationsTab />}
      {tab === 'contacts' && <ContactsTab />}
      {tab === 'interviews' && <InterviewsTab />}
      {tab === 'admin' && user.role === 'admin' && <AdminPanel />}
    </div>
  )
}

function MiniStat({ label, value, color = 'text-white' }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-3 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${color}`}>{value}</p>
    </div>
  )
}

function ApplicationsTab() {
  const { state, addApplication, updateApplication, deleteApplication } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Application | null>(null)
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()

  const apps = [...state.applications]
    .filter((a) => filter === 'all' || a.status === filter)
    .filter((a) => !query || a.company.toLowerCase().includes(query) || a.role.toLowerCase().includes(query))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const empty: Omit<Application, 'id' | 'createdAt' | 'updatedAt'> = {
    company: '', role: '', status: 'draft', appliedDate: null, url: '', notes: '', contactId: null,
  }

  return (
    <div className="space-y-4">
      <SearchInput value={search} onChange={setSearch} placeholder="Firma oder Position suchen…" />

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1">
          <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} label="Alle" />
          {(Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]).map((s) => (
            <FilterBtn key={s} active={filter === s} onClick={() => setFilter(s)} label={APPLICATION_STATUS_LABELS[s]} />
          ))}
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          + Bewerbung
        </button>
      </div>

      {showForm && (
        <ApplicationForm
          initial={editing ?? empty}
          contacts={state.contacts}
          onSave={(data) => {
            if (editing) updateApplication(editing.id, data)
            else addApplication(data)
            setShowForm(false)
            setEditing(null)
          }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {apps.length === 0 ? (
        <EmptyState text={query ? 'Keine Treffer für deine Suche.' : 'Noch keine Bewerbungen. Leg die erste an!'} />
      ) : (
        <div className="space-y-2">
          {apps.map((app) => (
            <div key={app.id} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-white">{app.company}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${APPLICATION_STATUS_COLORS[app.status]}`}>
                      {APPLICATION_STATUS_LABELS[app.status]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">{app.role}</p>
                  {app.appliedDate && <p className="text-xs text-slate-500 mt-1">Gesendet: {app.appliedDate}</p>}
                  {app.notes && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{app.notes}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {app.url && (
                    <a href={app.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1">
                      Link
                    </a>
                  )}
                  <button onClick={() => { setEditing(app); setShowForm(true) }} className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1">✎</button>
                  <button onClick={() => deleteApplication(app.id)} className="text-xs text-slate-600 hover:text-red-400 px-2 py-1">✕</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {(Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateApplication(app.id, { status: s })}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      app.status === s ? APPLICATION_STATUS_COLORS[s] : 'border-slate-700 text-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {APPLICATION_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ApplicationForm({
  initial,
  contacts,
  onSave,
  onCancel,
}: {
  initial: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>
  contacts: Contact[]
  onSave: (data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(initial)

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-slate-800/30 p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput label="Firma" value={form.company} onChange={(v) => setForm({ ...form, company: v })} placeholder="z.B. Tech GmbH" />
        <TextInput label="Position" value={form.role} onChange={(v) => setForm({ ...form, role: v })} placeholder="z.B. Junior Developer" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as ApplicationStatus })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200"
          >
            {(Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]).map((s) => (
              <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <TextInput label="Beworben am" value={form.appliedDate ?? ''} onChange={(v) => setForm({ ...form, appliedDate: v || null })} type="date" />
      </div>
      <TextInput label="Stellenlink" value={form.url} onChange={(v) => setForm({ ...form, url: v })} placeholder="https://..." />
      {contacts.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Kontakt</label>
          <select
            value={form.contactId ?? ''}
            onChange={(e) => setForm({ ...form, contactId: e.target.value || null })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200"
          >
            <option value="">Kein Kontakt</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name} – {c.company}</option>
            ))}
          </select>
        </div>
      )}
      <TextArea label="Notizen" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} rows={3} />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-300 px-4 py-2">Abbrechen</button>
        <SaveButton onClick={() => onSave(form)} />
      </div>
    </div>
  )
}

function ContactsTab() {
  const { state, addContact, updateContact, deleteContact } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()
  const contacts = state.contacts.filter(
    (c) => !query || c.name.toLowerCase().includes(query) || c.company.toLowerCase().includes(query),
  )

  const empty: Omit<Contact, 'id' | 'createdAt'> = {
    name: '', company: '', role: '', email: '', linkedin: '', notes: '',
  }

  return (
    <div className="space-y-4">
      <SearchInput value={search} onChange={setSearch} placeholder="Name oder Firma suchen…" />

      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">
          + Kontakt
        </button>
      </div>

      {showForm && (
        <ContactForm
          initial={editing ?? empty}
          onSave={(data) => {
            if (editing) updateContact(editing.id, data)
            else addContact(data)
            setShowForm(false)
            setEditing(null)
          }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {contacts.length === 0 ? (
        <EmptyState text={query ? 'Keine Treffer für deine Suche.' : 'Noch keine Kontakte. Recruiter, Kollegen, Netzwerk...'} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {contacts.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-white">{c.name}</h3>
                  <p className="text-sm text-slate-400">{c.role} @ {c.company}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(c); setShowForm(true) }} className="text-xs text-slate-500 hover:text-slate-300">✎</button>
                  <button onClick={() => deleteContact(c.id)} className="text-xs text-slate-600 hover:text-red-400">✕</button>
                </div>
              </div>
              {c.email && <p className="text-xs text-slate-500 mt-2">{c.email}</p>}
              {c.linkedin && (
                <a href={c.linkedin} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 block">
                  LinkedIn
                </a>
              )}
              {c.notes && <p className="text-xs text-slate-500 mt-2">{c.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ContactForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<Contact, 'id' | 'createdAt'>
  onSave: (data: Omit<Contact, 'id' | 'createdAt'>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(initial)

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-slate-800/30 p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <TextInput label="Firma" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput label="Rolle" value={form.role} onChange={(v) => setForm({ ...form, role: v })} placeholder="z.B. HR, Teamlead" />
        <TextInput label="E-Mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
      </div>
      <TextInput label="LinkedIn" value={form.linkedin} onChange={(v) => setForm({ ...form, linkedin: v })} placeholder="https://linkedin.com/in/..." />
      <TextArea label="Notizen" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} rows={2} />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-300 px-4 py-2">Abbrechen</button>
        <SaveButton onClick={() => onSave(form)} />
      </div>
    </div>
  )
}

function InterviewsTab() {
  const { state, addInterviewNote, updateInterviewNote, deleteInterviewNote } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<InterviewNote | null>(null)
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()

  const empty: Omit<InterviewNote, 'id'> = {
    applicationId: null, company: '', date: new Date().toISOString().slice(0, 10),
    type: 'video', questions: '', myAnswers: '', feedback: '', outcome: '', notes: '',
  }

  const notes = [...state.interviewNotes]
    .filter((n) => !query || n.company.toLowerCase().includes(query))
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-4">
      <SearchInput value={search} onChange={setSearch} placeholder="Firma suchen…" />

      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">
          + Interviewnotiz
        </button>
      </div>

      {showForm && (
        <InterviewForm
          initial={editing ?? empty}
          applications={state.applications}
          onSave={(data) => {
            if (editing) updateInterviewNote(editing.id, data)
            else addInterviewNote(data)
            setShowForm(false)
            setEditing(null)
          }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {notes.length === 0 ? (
        <EmptyState text={query ? 'Keine Treffer für deine Suche.' : 'Noch keine Interviewnotizen. Dokumentiere Fragen und Antworten!'} />
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{n.company}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                      {INTERVIEW_TYPE_LABELS[n.type]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{n.date}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(n); setShowForm(true) }} className="text-xs text-slate-500 hover:text-slate-300">✎</button>
                  <button onClick={() => deleteInterviewNote(n.id)} className="text-xs text-slate-600 hover:text-red-400">✕</button>
                </div>
              </div>
              {n.questions && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-500">Fragen</p>
                  <p className="text-sm text-slate-300 mt-0.5 whitespace-pre-wrap">{n.questions}</p>
                </div>
              )}
              {n.myAnswers && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-slate-500">Meine Antworten</p>
                  <p className="text-sm text-slate-300 mt-0.5 whitespace-pre-wrap">{n.myAnswers}</p>
                </div>
              )}
              {n.feedback && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-slate-500">Feedback</p>
                  <p className="text-sm text-slate-300 mt-0.5">{n.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InterviewForm({
  initial,
  applications,
  onSave,
  onCancel,
}: {
  initial: Omit<InterviewNote, 'id'>
  applications: Application[]
  onSave: (data: Omit<InterviewNote, 'id'>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(initial)

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-slate-800/30 p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput label="Firma" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
        <TextInput label="Datum" value={form.date} onChange={(v) => setForm({ ...form, date: v })} type="date" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Art</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as InterviewType })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200"
          >
            {(Object.keys(INTERVIEW_TYPE_LABELS) as InterviewType[]).map((t) => (
              <option key={t} value={t}>{INTERVIEW_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        {applications.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Bewerbung</label>
            <select
              value={form.applicationId ?? ''}
              onChange={(e) => {
                const app = applications.find((a) => a.id === e.target.value)
                setForm({
                  ...form,
                  applicationId: e.target.value || null,
                  company: app?.company ?? form.company,
                })
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200"
            >
              <option value="">Keine Verknüpfung</option>
              {applications.map((a) => (
                <option key={a.id} value={a.id}>{a.company} – {a.role}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <TextArea label="Gestellte Fragen" value={form.questions} onChange={(v) => setForm({ ...form, questions: v })} rows={3} placeholder="Welche Fragen wurden gestellt?" />
      <TextArea label="Meine Antworten" value={form.myAnswers} onChange={(v) => setForm({ ...form, myAnswers: v })} rows={3} placeholder="Wie habe ich geantwortet? Was würde ich besser machen?" />
      <TextArea label="Feedback erhalten" value={form.feedback} onChange={(v) => setForm({ ...form, feedback: v })} rows={2} />
      <TextInput label="Ergebnis" value={form.outcome} onChange={(v) => setForm({ ...form, outcome: v })} placeholder="z.B. Nächste Runde, Absage..." />
      <TextArea label="Notizen" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} rows={2} />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-300 px-4 py-2">Abbrechen</button>
        <SaveButton onClick={() => onSave(form)} />
      </div>
    </div>
  )
}

function FilterBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
        active ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'border-slate-700 text-slate-500 hover:border-slate-500'
      }`}
    >
      {label}
    </button>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center">
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  )
}
