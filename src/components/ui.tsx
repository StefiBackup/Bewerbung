import { useState } from 'react'

interface TextAreaProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}

export function TextArea({ label, value, onChange, placeholder, rows = 3 }: TextAreaProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
      />
    </div>
  )
}

interface TextInputProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}

export function TextInput({ label, value, onChange, placeholder, type = 'text' }: TextInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  )
}

interface SaveButtonProps {
  onClick: () => void
  saved?: boolean
}

export function SaveButton({ onClick, saved }: SaveButtonProps) {
  const [showSaved, setShowSaved] = useState(false)

  const handleClick = () => {
    onClick()
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
    >
      {showSaved || saved ? '✓ Gespeichert' : 'Speichern'}
    </button>
  )
}

interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder = 'Firma suchen…' }: SearchInputProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">🔍</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-800/50 pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm"
          aria-label="Suche löschen"
        >
          ✕
        </button>
      )}
    </div>
  )
}
