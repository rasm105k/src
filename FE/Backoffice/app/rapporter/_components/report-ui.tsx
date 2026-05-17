import { CheckCircle2, CircleAlert, CircleHelp, FileText, XCircle } from 'lucide-react'
import type { DocumentFieldViewModelResponse, DocumentViewModelResponse } from '@/lib/document-api/schemas'

export function ReportStatusBadge({ value }: { value: string | null }) {
  const label = value ?? 'Ikke sat'
  const lower = label.toLowerCase()
  const Icon =
    lower.includes('approved') || lower.includes('confirmed')
      ? CheckCircle2
      : lower.includes('rejected') || lower.includes('failed')
        ? XCircle
        : lower.includes('review') || lower.includes('missing') || lower.includes('conflict')
          ? CircleAlert
          : CircleHelp
  const color =
    lower.includes('approved') || lower.includes('confirmed')
      ? 'bg-green-50 text-green-700 ring-green-600/20'
      : lower.includes('rejected') || lower.includes('failed')
        ? 'bg-red-50 text-red-700 ring-red-600/20'
        : lower.includes('review') || lower.includes('missing') || lower.includes('conflict')
          ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
          : 'bg-gray-100 text-gray-600 ring-gray-600/10'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  )
}

export function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">-</span>
  }

  const color =
    score >= 90
      ? 'bg-green-50 text-green-700'
      : score >= 70
        ? 'bg-amber-50 text-amber-700'
        : 'bg-red-50 text-red-700'

  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{Math.round(score)}%</span>
}

export function ReportFieldTable({ viewModel }: { viewModel: DocumentViewModelResponse }) {
  return (
    <div className="space-y-3">
      {viewModel.sections.map(section => (
        <section key={section.id} className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">{section.title}</h2>
              <p className="mt-0.5 text-xs text-gray-400">{section.fields.length} felter</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {section.fields.length > 0 ? (
              section.fields.map(field => (
                <ReportFieldRow key={`${field.key}:${field.instanceIndex}`} field={field} />
              ))
            ) : (
              <p className="px-4 py-4 text-sm text-gray-400">Ingen felter i denne sektion.</p>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

export function ReportFileList({ viewModel }: { viewModel: DocumentViewModelResponse }) {
  if (viewModel.files.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
        Ingen filer er linket til rapporten.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {viewModel.files.map(file => (
        <div key={file.id} className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
              <FileText size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm font-medium text-gray-900">{file.fileName}</p>
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {file.purpose}
                </span>
              </div>
              <p className="mt-1 truncate font-mono text-xs text-gray-400">
                {file.containerName}/{file.blobName}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {file.contentType} · {formatBytes(file.fileSizeBytes)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function calculateReportStats(viewModel: DocumentViewModelResponse) {
  const fields = viewModel.sections.flatMap(section => section.fields)

  return fields.reduce(
    (stats, field) => {
      const missingValue = !field.value.display && !field.value.corrected && !field.value.normalized && !field.value.raw && !field.value.json
      const normalizedStatus = field.status?.toLowerCase() ?? ''

      return {
        total: stats.total + 1,
        missing: stats.missing + (missingValue || normalizedStatus === 'missing' ? 1 : 0),
        needsReview: stats.needsReview + (normalizedStatus.includes('review') || normalizedStatus === 'conflict' ? 1 : 0),
        lowConfidence: stats.lowConfidence + (field.confidence !== null && field.confidence < 75 ? 1 : 0),
      }
    },
    { total: 0, missing: 0, needsReview: 0, lowConfidence: 0 },
  )
}

function ReportFieldRow({ field }: { field: DocumentFieldViewModelResponse }) {
  const value = fieldDisplayValue(field)

  return (
    <div className="grid gap-3 px-4 py-3 sm:grid-cols-[240px_minmax(0,1fr)_170px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-gray-900">{field.label}</p>
          {field.required && (
            <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              Krav
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate font-mono text-xs text-gray-400">
          {field.key}{field.instanceIndex > 0 ? ` #${field.instanceIndex + 1}` : ''}
        </p>
      </div>

      <p className={`min-w-0 rounded-lg px-3 py-2 text-sm ${fieldValueClass(field)}`}>
        {value}
      </p>

      <div className="flex items-center justify-start gap-2 sm:justify-end">
        <ReportStatusBadge value={field.status} />
        <ScoreBadge score={field.confidence} />
      </div>
    </div>
  )
}

function fieldValueClass(field: DocumentFieldViewModelResponse): string {
  const hasValue = field.value.display || field.value.corrected || field.value.normalized || field.value.raw || field.value.json
  if (!hasValue) return 'bg-red-50 text-red-700'
  if (field.status?.toLowerCase() === 'corrected') return 'bg-blue-50 text-blue-800'
  if (field.confidence !== null && field.confidence < 75) return 'bg-amber-50 text-amber-800'
  return 'bg-gray-50 text-gray-800'
}

function fieldDisplayValue(field: DocumentFieldViewModelResponse): string {
  if (field.value.display) return field.value.display
  if (field.value.corrected) return field.value.corrected
  if (field.value.normalized) return field.value.normalized
  if (field.value.raw) return field.value.raw
  if (field.value.json) return JSON.stringify(field.value.json)
  return 'Mangler'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
