import { AlertCircle, Database, FileText, Loader2 } from 'lucide-react'
import { DocumentApiError } from '@/lib/document-api/client'

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {children}
    </div>
  )
}

export function Panel({ title, subtitle, children, actions }: {
  title: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-xs">
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

export function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-gray-900">{value}</p>
    </div>
  )
}

export function ApiErrorNotice({ error }: { error: unknown }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <div className="flex items-start gap-2">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">DocumentApi kunne ikke indlæses</p>
          <p className="mt-0.5 text-xs">{apiErrorMessage(error)}</p>
        </div>
      </div>
    </div>
  )
}

export function LoadingRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-lg bg-gray-100" />
      ))}
    </div>
  )
}

export function EmptyState({ title, text, kind = 'documents' }: {
  title: string
  text: string
  kind?: 'documents' | 'fields'
}) {
  const Icon = kind === 'fields' ? Database : FileText

  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
      <Icon size={26} className="mb-3 text-gray-300" />
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <p className="mt-1 max-w-md text-sm text-gray-400">{text}</p>
    </div>
  )
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
      active
        ? 'bg-green-50 text-green-700 ring-green-600/20'
        : 'bg-gray-100 text-gray-500 ring-gray-600/10'
    }`}>
      {active ? 'Aktiv' : 'Inaktiv'}
    </span>
  )
}

export function DataTypeBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[11px] font-medium text-gray-600">
      {value}
    </span>
  )
}

export function RequiredBadge({ required }: { required: boolean }) {
  if (!required) return <span className="text-xs text-gray-300">Valgfri</span>

  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
      Obligatorisk
    </span>
  )
}

export function FormField({ label, error, children }: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

export function InlineLoading({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-gray-500">
      <Loader2 size={14} className="animate-spin" />
      {label}
    </span>
  )
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof DocumentApiError) {
    return `${error.message}${error.status ? ` (${error.status})` : ''}`
  }

  if (error instanceof Error) return error.message

  return 'Ukendt fejl'
}
