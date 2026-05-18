import { CheckCircle2, CircleAlert, CircleHelp, Download, FileText, Trash2, XCircle } from 'lucide-react'
import type { DocumentFieldViewModelResponse, DocumentFileViewModelResponse, DocumentViewModelResponse } from '@/lib/document-api/schemas'
import { reportFileContentUrl } from '@/lib/document-api/client'
import { cleanText } from '@/lib/document-api/text'

export type FieldDraft = Record<string, string>

const REPORT_STATUS_LABELS: Record<string, string> = {
  Draft: 'Kladde',
  Uploaded: 'Uploadet',
  Processing: 'Behandles',
  InReview: 'Til gennemgang',
  Approved: 'Godkendt',
  Rejected: 'Afvist',
  Archived: 'Arkiveret',
}

const REVIEW_STATUS_LABELS: Record<string, string> = {
  NotStarted: 'Ikke startet',
  Processing: 'Behandles',
  NeedsReview: 'Skal gennemgås',
  ReadyForApproval: 'Klar til godkendelse',
  Approved: 'Godkendt',
  Rejected: 'Afvist',
}

export function ReportStatusBadge({ value }: { value: string | null }) {
  const label = formatStatusLabel(value)
  const lower = (value ?? label).toLowerCase()
  const Icon =
    lower.includes('approved') || lower.includes('confirmed') || lower.includes('godkendt')
      ? CheckCircle2
      : lower.includes('rejected') || lower.includes('failed') || lower.includes('afvist')
        ? XCircle
        : lower.includes('review') || lower.includes('missing') || lower.includes('conflict') || lower.includes('needsreview')
          ? CircleAlert
          : CircleHelp
  const color =
    lower.includes('approved') || lower.includes('confirmed') || lower.includes('godkendt')
      ? 'bg-green-50 text-green-700 ring-green-600/20'
      : lower.includes('rejected') || lower.includes('failed') || lower.includes('afvist')
        ? 'bg-red-50 text-red-700 ring-red-600/20'
        : lower.includes('review') || lower.includes('missing') || lower.includes('conflict') || lower.includes('needsreview')
          ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
          : 'bg-gray-100 text-gray-600 ring-gray-600/10'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  )
}

export function ReviewSummary({ reviewStatus, score }: { reviewStatus: string | null; score: number | null }) {
  const label = formatReviewStatus(reviewStatus)
  const scoreLabel = score === null ? null : `${Math.round(score)}%`

  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
      <span className="font-medium">{label}</span>
      {scoreLabel && <span className="text-gray-400">{scoreLabel}</span>}
    </span>
  )
}

export function formatReportStatus(value: string | null): string {
  if (!value) return 'Ikke sat'
  return REPORT_STATUS_LABELS[value] ?? cleanText(value)
}

export function formatReviewStatus(value: string | null): string {
  if (!value) return 'Ikke vurderet'
  return REVIEW_STATUS_LABELS[value] ?? cleanText(value)
}

function formatStatusLabel(value: string | null): string {
  if (!value) return 'Ikke sat'
  return REVIEW_STATUS_LABELS[value] ?? REPORT_STATUS_LABELS[value] ?? cleanText(value)
}

export function ReportSectionGroups({
  viewModel,
  editMode = false,
  drafts = {},
  onDraftChange,
}: {
  viewModel: DocumentViewModelResponse
  editMode?: boolean
  drafts?: FieldDraft
  onDraftChange?: (field: DocumentFieldViewModelResponse, value: string) => void
}) {
  const sections = viewModel.sections.map(section => {
    const visibleFields = editMode
      ? section.fields
      : section.fields.filter(field => shouldShowField(field))
    const hiddenFields = editMode
      ? []
      : section.fields.filter(field => !shouldShowField(field))

    return {
      id: section.id,
      title: cleanText(section.title),
      visibleFields,
      hiddenFields,
      groups: groupFields(visibleFields, section.title),
    }
  })
  const visibleFieldCount = sections.reduce((sum, section) => sum + section.visibleFields.length, 0)
  const hiddenFieldCount = sections.reduce((sum, section) => sum + section.hiddenFields.length, 0)

  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">Rapportdata</h2>
        </div>
        <span className="shrink-0 text-xs text-gray-400">
          {fieldCountLabel(visibleFieldCount)}{hiddenFieldCount > 0 ? ` · ${hiddenFieldCount} skjult` : ''}
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {sections.map(section => (
          <div key={section.id}>
            <div className="flex items-center justify-between gap-3 bg-gray-50/70 px-3 py-1.5">
              <h3 className="truncate text-xs font-semibold uppercase tracking-wide text-gray-500">{section.title}</h3>
              <span className="shrink-0 text-[11px] text-gray-400">{section.visibleFields.length}</span>
            </div>

            {section.groups.length > 0 ? (
              <div className="px-3 py-1">
                {section.groups.map(group => (
                  <div key={group.id} className="py-0.5">
                    {group.showTitle && (
                      <h4 className="px-0.5 py-1 text-[11px] font-medium text-gray-400">{group.title}</h4>
                    )}
                    <div className="divide-y divide-gray-100">
                      {group.fields.map(field => (
                        <ReportFieldRow
                          key={`${field.key}:${field.instanceIndex}`}
                          field={field}
                          editMode={editMode}
                          draftValue={drafts[fieldDraftKey(field)] ?? fieldDisplayValue(field)}
                          onDraftChange={onDraftChange}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-3 py-2 text-sm text-gray-400">Ingen udfyldte felter i denne sektion.</p>
            )}

            {section.hiddenFields.length > 0 && (
              <details className="border-t border-gray-100 px-3 py-1.5">
                <summary className="cursor-pointer text-xs font-medium text-gray-400 hover:text-gray-600">
                  Vis {section.hiddenFields.length} tomme valgfrie felter
                </summary>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {section.hiddenFields.map(field => (
                    <span
                      key={`${field.key}:${field.instanceIndex}`}
                      className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] text-gray-400"
                    >
                      {cleanText(field.label)}
                    </span>
                  ))}
                </div>
              </details>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export function ReportFileList({
  reportId,
  files,
  onRemove,
  removingFileId,
}: {
  reportId: string
  files: DocumentFileViewModelResponse[]
  onRemove?: (file: DocumentFileViewModelResponse) => void
  removingFileId?: string | null
}) {
  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
        Ingen dokumenter er linket til rapporten.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {files.map(file => (
        <div key={file.id} className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
              <FileText size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm font-medium text-gray-900">{cleanText(file.fileName)}</p>
                <div className="flex shrink-0 items-center gap-1">
                  {canOpenFile(file) && (
                    <a
                      href={reportFileContentUrl(reportId, file.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-gray-50 hover:text-gray-700"
                      title="Åbn dokument"
                    >
                      <Download size={14} />
                    </a>
                  )}
                  {onRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(file)}
                      disabled={removingFileId === file.id}
                      className="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Fjern dokument"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1 truncate font-mono text-xs text-gray-400">
                {cleanText(file.containerName)}/{cleanText(file.blobName)}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {cleanText(file.purpose)} · {cleanText(file.contentType)} · {formatBytes(file.fileSizeBytes)}
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

export function fieldDraftKey(field: DocumentFieldViewModelResponse): string {
  return `${field.key}:${field.instanceIndex}`
}

export function fieldDisplayValue(field: DocumentFieldViewModelResponse): string {
  if (field.value.display) return cleanText(field.value.display)
  if (field.value.corrected) return cleanText(field.value.corrected)
  if (field.value.normalized) return cleanText(field.value.normalized)
  if (field.value.raw) return cleanText(field.value.raw)
  if (field.value.json) return cleanText(JSON.stringify(field.value.json))
  return ''
}

type FieldGroup = {
  id: string
  title: string
  showTitle: boolean
  fields: DocumentFieldViewModelResponse[]
}

const FIELD_GROUP_LABELS: Record<string, string> = {
  'customer.contact': 'Kontakt',
  'customer.address': 'Adresse',
  'customer.billing': 'Fakturering',
  'site.access': 'Adgang',
  'site.installation': 'Installation',
  'task.description': 'Opgave',
  'task.scope': 'Omfang',
  'work.lines': 'Timer og materialer',
  'work.materials': 'Materialer',
  'work.hours': 'Timer',
  'performed.date': 'Udførelse',
  'performed.by': 'Udførelse',
  'technician.signature': 'Montør',
  'signature.date': 'Attestering',
  'supplier.contacts': 'Kontakter',
  'maintenance.plan': 'Plan',
  'flow.temperature': 'Temperatur',
  'flow.table': 'Flowtabel',
  'circuit.rows': 'Kredse',
  'labor.hours': 'Timer',
  'labor.rate': 'Priser',
  'amount.estimated': 'Beløb',
  'postman.extra': 'Demo/import',
}

function groupFields(fields: DocumentFieldViewModelResponse[], sectionTitle: string): FieldGroup[] {
  if (fields.length <= 3) {
    return [{ id: 'main', title: cleanText(sectionTitle), showTitle: false, fields }]
  }

  const byGroup = new Map<string, DocumentFieldViewModelResponse[]>()
  for (const field of fields) {
    const groupId = fieldGroupId(field)
    byGroup.set(groupId, [...(byGroup.get(groupId) ?? []), field])
  }

  if (byGroup.size <= 1) {
    return [{ id: 'main', title: cleanText(sectionTitle), showTitle: false, fields }]
  }

  return [...byGroup.entries()].map(([id, groupFields]) => ({
    id,
    title: fieldGroupTitle(id),
    showTitle: true,
    fields: groupFields,
  }))
}

function fieldGroupId(field: DocumentFieldViewModelResponse): string {
  const parts = field.key.split('.').filter(Boolean)
  if (parts.length >= 2) return `${parts[0]}.${parts[1]}`
  return parts[0] ?? 'other'
}

function fieldGroupTitle(id: string): string {
  if (FIELD_GROUP_LABELS[id]) return FIELD_GROUP_LABELS[id]

  const [prefix, detail] = id.split('.')
  const fallback = detail || prefix || 'Felter'
  return toTitle(cleanText(fallback.replace(/[_-]/g, ' ')))
}

function toTitle(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function ReportFieldRow({
  field,
  editMode,
  draftValue,
  onDraftChange,
}: {
  field: DocumentFieldViewModelResponse
  editMode: boolean
  draftValue: string
  onDraftChange?: (field: DocumentFieldViewModelResponse, value: string) => void
}) {
  const lowConfidence = field.confidence !== null && field.confidence < 75
  const missing = !draftValue

  return (
    <div className="grid min-w-0 gap-1.5 py-1.5 text-sm sm:grid-cols-[160px_minmax(0,1fr)_72px] sm:items-center sm:gap-3">
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="truncate text-xs font-medium text-gray-400">{cleanText(field.label)}</p>
        {field.required && <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Krav</span>}
      </div>
      {editMode ? (
        <input
          value={draftValue}
          onChange={event => onDraftChange?.(field, event.target.value)}
          className="min-h-8 w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
        />
      ) : (
        <p className={`min-w-0 truncate text-sm ${missing ? 'text-red-700' : 'text-gray-800'}`}>
          {draftValue || 'Mangler'}
        </p>
      )}
      <div className="flex items-center justify-start gap-1.5 sm:justify-end">
        {field.confidence !== null && (
          <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${lowConfidence ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400'}`}>
            {Math.round(field.confidence)}%
          </span>
        )}
        {missing && <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-700">Mangler</span>}
      </div>
    </div>
  )
}

function shouldShowField(field: DocumentFieldViewModelResponse): boolean {
  if (field.required) return true
  if (field.status) return true
  if (field.confidence !== null) return true
  return Boolean(fieldDisplayValue(field))
}

function fieldCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'felt' : 'felter'}`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function canOpenFile(file: DocumentFileViewModelResponse): boolean {
  return file.storageAccountName === 'localdevstore' && file.containerName === 'report-attachments'
}
