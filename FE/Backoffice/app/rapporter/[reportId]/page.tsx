'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ArrowLeft, Download, Loader2, Pencil, Plus, Save, X } from 'lucide-react'
import {
  deleteReportFile,
  documentApiKeys,
  getReport,
  getReportViewModel,
  updateReport,
  uploadReportFiles,
  upsertReportField,
} from '@/lib/document-api/client'
import type {
  DocumentFieldViewModelResponse,
  DocumentFileViewModelResponse,
  DocumentViewModelResponse,
  ReportResponse,
} from '@/lib/document-api/schemas'
import { cleanText } from '@/lib/document-api/text'
import {
  ApiErrorNotice,
  EmptyState,
  FormField,
  InlineLoading,
  PageShell,
  Panel,
  apiErrorMessage,
} from '@/app/admin/_components/admin-ui'
import {
  fieldDisplayValue,
  fieldDraftKey,
  formatReportStatus,
  formatReviewStatus,
  ReportFileList,
  ReportSectionGroups,
  type FieldDraft,
} from '../_components/report-ui'

const reportEditSchema = z.object({
  title: z.string(),
  reportNumber: z.string(),
  status: z.string().min(1),
  reviewStatus: z.string().min(1),
  reviewScore: z.number().min(0).max(100).nullable(),
})

type ReportEditValues = z.infer<typeof reportEditSchema>
type LocalHistoryEvent = { id: string; at: string; title: string; text: string }

const REPORT_STATUSES = ['Draft', 'Uploaded', 'Processing', 'InReview', 'Approved', 'Rejected', 'Archived']
const REVIEW_STATUSES = ['NotStarted', 'Processing', 'NeedsReview', 'ReadyForApproval', 'Approved', 'Rejected']

export default function ReportDetailPage() {
  const params = useParams<{ reportId: string }>()
  const reportId = params.reportId
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editMode, setEditMode] = useState(false)
  const [fieldDrafts, setFieldDrafts] = useState<FieldDraft>({})
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [localHistory, setLocalHistory] = useState<LocalHistoryEvent[]>([])
  const [removingFileId, setRemovingFileId] = useState<string | null>(null)

  const reportQuery = useQuery({
    queryKey: documentApiKeys.report(reportId),
    queryFn: () => getReport(reportId),
    enabled: Boolean(reportId),
  })
  const viewModelQuery = useQuery({
    queryKey: documentApiKeys.reportViewModel(reportId),
    queryFn: () => getReportViewModel(reportId),
    enabled: Boolean(reportId),
  })

  const form = useForm<ReportEditValues>({
    resolver: zodResolver(reportEditSchema),
    defaultValues: {
      title: '',
      reportNumber: '',
      status: 'InReview',
      reviewStatus: 'NeedsReview',
      reviewScore: null,
    },
  })

  const viewModel = viewModelQuery.data
  const report = reportQuery.data

  useEffect(() => {
    if (!viewModel) return
    setFieldDrafts(initialFieldDrafts(viewModel))
  }, [viewModel])

  useEffect(() => {
    if (!report) return
    form.reset({
      title: cleanText(report.title ?? ''),
      reportNumber: cleanText(report.reportNumber ?? ''),
      status: report.status,
      reviewStatus: report.reviewStatus,
      reviewScore: report.reviewScore,
    })
  }, [form, report])

  const invalidateReport = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: documentApiKeys.report(reportId) }),
      queryClient.invalidateQueries({ queryKey: documentApiKeys.reportViewModel(reportId) }),
      queryClient.invalidateQueries({ queryKey: documentApiKeys.reports({ limit: 200 }) }),
    ])
  }

  const saveMutation = useMutation({
    mutationFn: async (values: ReportEditValues) => {
      if (!viewModel) return

      await updateReport(reportId, {
        title: nullableText(values.title),
        reportNumber: nullableText(values.reportNumber),
        status: values.status,
        reviewStatus: values.reviewStatus,
        reviewScore: values.reviewScore,
      })

      const changedFields = viewModel.sections
        .flatMap(section => section.fields)
        .filter(field => (fieldDrafts[fieldDraftKey(field)] ?? '') !== fieldDisplayValue(field))

      for (const field of changedFields) {
        const correctedValue = nullableText(fieldDrafts[fieldDraftKey(field)] ?? '')
        await upsertReportField(reportId, {
          fieldKey: field.key,
          instanceIndex: field.instanceIndex,
          label: cleanText(field.label),
          dataType: field.fieldType,
          rawValue: field.value.raw,
          normalizedValue: field.value.normalized,
          correctedValue,
          value: field.value.json,
          confidence: field.confidence,
          status: correctedValue ? 'Corrected' : 'Missing',
          source: 'User',
          boundingRegions: field.boundingRegions,
          correctedByUserId: null,
        })
      }
    },
    onSuccess: async () => {
      setEditMode(false)
      setMessage({ tone: 'success', text: 'Rapporten blev gemt.' })
      addLocalHistory('Rapport redigeret', 'Stamdata eller feltværdier blev opdateret i Backoffice.')
      await invalidateReport()
    },
    onError: error => setMessage({ tone: 'error', text: apiErrorMessage(error) }),
  })

  const uploadFilesMutation = useMutation({
    mutationFn: (files: File[]) => uploadReportFiles(reportId, files),
    onSuccess: async files => {
      setMessage({ tone: 'success', text: uploadSuccessMessage(files.length) })
      addLocalHistory('Dokument uploadet', files.map(file => cleanText(file.fileName)).join(', '))
      await invalidateReport()
    },
    onError: error => setMessage({ tone: 'error', text: apiErrorMessage(error) }),
  })

  const deleteFileMutation = useMutation({
    mutationFn: (file: DocumentFileViewModelResponse) => deleteReportFile(reportId, file.id),
    onMutate: file => setRemovingFileId(file.id),
    onSuccess: async (_, file) => {
      setRemovingFileId(null)
      setMessage({ tone: 'success', text: `Dokumentet "${cleanText(file.fileName)}" blev fjernet.` })
      addLocalHistory('Dokument fjernet', cleanText(file.fileName))
      await invalidateReport()
    },
    onError: error => {
      setRemovingFileId(null)
      setMessage({ tone: 'error', text: apiErrorMessage(error) })
    },
  })

  function addLocalHistory(title: string, text: string) {
    setLocalHistory(prev => [
      { id: crypto.randomUUID(), at: new Date().toISOString(), title, text },
      ...prev,
    ])
  }

  function cancelEdit() {
    setEditMode(false)
    setMessage(null)
    if (viewModel) setFieldDrafts(initialFieldDrafts(viewModel))
    if (report) {
      form.reset({
        title: cleanText(report.title ?? ''),
        reportNumber: cleanText(report.reportNumber ?? ''),
        status: report.status,
        reviewStatus: report.reviewStatus,
        reviewScore: report.reviewScore,
      })
    }
  }

  function changeDraft(field: DocumentFieldViewModelResponse, value: string) {
    setFieldDrafts(prev => ({ ...prev, [fieldDraftKey(field)]: value }))
  }

  function handleFileInput(files: FileList | null) {
    if (!files || files.length === 0) return
    uploadFilesMutation.mutate(Array.from(files))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (reportQuery.isLoading || viewModelQuery.isLoading) {
    return (
      <PageShell>
        <InlineLoading label="Henter rapport..." />
      </PageShell>
    )
  }

  if (reportQuery.error || viewModelQuery.error) {
    return (
      <PageShell>
        <BackLink />
        <ApiErrorNotice error={reportQuery.error ?? viewModelQuery.error} />
      </PageShell>
    )
  }

  if (!viewModel || !report) {
    return (
      <PageShell>
        <BackLink />
        <EmptyState title="Rapporten blev ikke fundet" text="DocumentApi returnerede ikke en rapport med dette ID." />
      </PageShell>
    )
  }

  const summary = reportSummary(viewModel)
  const history = buildHistory(report, localHistory)

  return (
    <PageShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <BackLink />
          <h1 className="text-xl font-bold tracking-tight">
            {cleanText(viewModel.title || viewModel.reportNumber || viewModel.documentTypeName)}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {cleanText(viewModel.documentTypeName)} · {cleanText(viewModel.reportNumber ?? reportId)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {editMode ? (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <X size={15} />
                Annuller
              </button>
              <button
                type="button"
                onClick={form.handleSubmit(values => saveMutation.mutate(values))}
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Gem
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => exportReportPdf(viewModel, summary)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Download size={15} />
                Eksporter PDF
              </button>
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >
                <Pencil size={15} />
                Rediger
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
          message.tone === 'error'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-green-200 bg-green-50 text-green-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main>
          <ReportSectionGroups
            viewModel={viewModel}
            editMode={editMode}
            drafts={fieldDrafts}
            onDraftChange={changeDraft}
          />
        </main>

        <aside className="space-y-4">
          <Panel title="Stamdata" subtitle="Kort rapportoverblik">
            {editMode ? (
              <form className="space-y-3">
                <FormField label="Titel" error={form.formState.errors.title?.message}>
                  <input {...form.register('title')} className={inputClassName} />
                </FormField>
                <FormField label="Rapportnummer" error={form.formState.errors.reportNumber?.message}>
                  <input {...form.register('reportNumber')} className={inputClassName} />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Status" error={form.formState.errors.status?.message}>
                    <select {...form.register('status')} className={inputClassName}>
                      {REPORT_STATUSES.map(status => (
                        <option key={status} value={status}>{formatReportStatus(status)}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Gennemgang" error={form.formState.errors.reviewStatus?.message}>
                    <select {...form.register('reviewStatus')} className={inputClassName}>
                      {REVIEW_STATUSES.map(status => (
                        <option key={status} value={status}>{formatReviewStatus(status)}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <FormField label="Score" error={form.formState.errors.reviewScore?.message}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    {...form.register('reviewScore', {
                      setValueAs: value => value === '' || Number.isNaN(value) ? null : Number(value),
                    })}
                    className={inputClassName}
                  />
                </FormField>
              </form>
            ) : (
              <div className="space-y-2 text-sm">
                <MetaRow label="Kunde" value={summary.customerName} />
                <MetaRow label="Adresse" value={summary.address} />
                <MetaRow label="Opgave" value={summary.taskDescription} />
                <MetaRow label="Udført" value={summary.performedDate} />
                <MetaRow label="Dokumenttype" value={cleanText(viewModel.documentTypeName)} />
                <MetaRow label="Rapportnummer" value={cleanText(viewModel.reportNumber ?? '-')} />
              </div>
            )}
          </Panel>

          <Panel
            title="Dokumenter"
            subtitle={`${viewModel.files.length} fil${viewModel.files.length === 1 ? '' : 'er'}`}
            actions={
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadFilesMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadFilesMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Upload
              </button>
            }
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={event => handleFileInput(event.target.files)}
            />
            <ReportFileList
              reportId={reportId}
              files={viewModel.files}
              onRemove={file => {
                if (window.confirm(`Fjern dokumentet "${cleanText(file.fileName)}" fra rapporten?`)) {
                  deleteFileMutation.mutate(file)
                }
              }}
              removingFileId={removingFileId}
            />
          </Panel>

          <Panel title="Versionering" subtitle="Dokumenthistorik">
            <div className="space-y-3">
              {history.map(event => (
                <div key={event.id} className="border-l border-gray-200 pl-3">
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{formatDateTime(event.at)}</p>
                  <p className="mt-1 text-xs text-gray-500">{event.text}</p>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </PageShell>
  )
}

const inputClassName = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100'

function BackLink() {
  return (
    <Link href="/rapporter" className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700">
      <ArrowLeft size={14} />
      Tilbage til rapporter
    </Link>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-gray-800">{value || '-'}</p>
    </div>
  )
}

function initialFieldDrafts(viewModel: DocumentViewModelResponse): FieldDraft {
  return Object.fromEntries(
    viewModel.sections
      .flatMap(section => section.fields)
      .map(field => [fieldDraftKey(field), fieldDisplayValue(field)]),
  )
}

function reportSummary(viewModel: DocumentViewModelResponse) {
  return {
    customerName: findFieldValue(viewModel, ['customer.name', 'customerName', 'customer']) || 'Ukendt kunde',
    address: findFieldValue(viewModel, ['site.address', 'address']) || 'Ingen adresse',
    taskDescription: findFieldValue(viewModel, ['task.description', 'description']) || 'Ingen opgavebeskrivelse',
    performedDate: findFieldValue(viewModel, ['performed.date', 'date']) || 'Ingen dato',
  }
}

function findFieldValue(viewModel: DocumentViewModelResponse, keys: string[]): string {
  const normalized = keys.map(key => key.toLowerCase())
  const field = viewModel.sections
    .flatMap(section => section.fields)
    .find(candidate => normalized.includes(candidate.key.toLowerCase()))

  return field ? fieldDisplayValue(field) : ''
}

function buildHistory(report: ReportResponse, localHistory: LocalHistoryEvent[]): LocalHistoryEvent[] {
  const events: LocalHistoryEvent[] = [
    ...localHistory,
    { id: 'updated', at: report.updatedAt, title: 'Senest opdateret', text: 'Rapportens data blev ændret.' },
    { id: 'created', at: report.createdAt, title: 'Oprettet', text: 'Rapporten blev oprettet i DocumentApi.' },
  ]

  if (report.submittedAt) {
    events.push({ id: 'submitted', at: report.submittedAt, title: 'Indsendt', text: 'Rapporten blev indsendt til review.' })
  }

  if (report.approvedAt) {
    events.push({ id: 'approved', at: report.approvedAt, title: 'Godkendt', text: 'Rapporten blev markeret som godkendt.' })
  }

  return dedupeHistory(events).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}

function dedupeHistory(events: LocalHistoryEvent[]): LocalHistoryEvent[] {
  const seen = new Set<string>()
  return events.filter(event => {
    const key = `${event.title}:${event.at}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function nullableText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function uploadSuccessMessage(count: number): string {
  return count === 1 ? 'Dokumentet blev uploadet.' : `${count} dokumenter blev uploadet.`
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function exportReportPdf(viewModel: DocumentViewModelResponse, summary: ReturnType<typeof reportSummary>) {
  const popup = window.open('', '_blank', 'width=1000,height=900')
  if (!popup) return

  popup.document.open()
  popup.document.write(`<!doctype html>
<html lang="da">
<head>
  <meta charset="utf-8" />
  <title>${escHtml(cleanText(viewModel.title || viewModel.reportNumber || viewModel.documentTypeName))}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f3f4f6; color: #111827; font-family: Arial, sans-serif; font-size: 12px; }
    .actions { position: sticky; top: 0; display: flex; justify-content: center; padding: 10px; background: rgba(243,244,246,.92); }
    button { border: 0; border-radius: 8px; background: #111827; color: white; padding: 9px 13px; font-weight: 700; cursor: pointer; }
    .page { width: 210mm; min-height: 297mm; margin: 14px auto; background: white; padding: 18mm; box-shadow: 0 4px 20px rgba(0,0,0,.1); }
    h1 { margin: 0 0 4px; font-size: 20px; }
    .muted { color: #6b7280; }
    .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 18px 0; }
    .box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; }
    .label { color: #9ca3af; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 3px; }
    h2 { margin: 18px 0 6px; font-size: 13px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
    .field { display: grid; grid-template-columns: 42mm 1fr; gap: 8px; padding: 4px 0; border-bottom: 1px solid #f3f4f6; }
    @page { size: A4; margin: 14mm; }
    @media print { body { background: white; } .actions { display: none; } .page { margin: 0; box-shadow: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="actions"><button onclick="window.print()">Gem som PDF / print</button></div>
  <main class="page">
    <h1>${escHtml(cleanText(viewModel.title || viewModel.documentTypeName))}</h1>
    <p class="muted">${escHtml(cleanText(viewModel.reportNumber ?? ''))}</p>
    <section class="summary">
      ${summaryBox('Kunde', summary.customerName)}
      ${summaryBox('Adresse', summary.address)}
      ${summaryBox('Opgave', summary.taskDescription)}
      ${summaryBox('Gennemgang', `${formatReviewStatus(viewModel.reviewStatus)} ${viewModel.reviewScore === null ? '' : `· ${Math.round(viewModel.reviewScore)}%`}`)}
    </section>
    ${viewModel.sections.map(section => `
      <h2>${escHtml(cleanText(section.title))}</h2>
      ${section.fields.map(field => `
        <div class="field">
          <div class="label">${escHtml(cleanText(field.label))}</div>
          <div>${escHtml(fieldDisplayValue(field) || 'Mangler')}</div>
        </div>
      `).join('')}
    `).join('')}
  </main>
</body>
</html>`)
  popup.document.close()
  popup.focus()
}

function summaryBox(label: string, value: string): string {
  return `<div class="box"><div class="label">${escHtml(label)}</div><div>${escHtml(value)}</div></div>`
}

function escHtml(value: unknown): string {
  return cleanText(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
