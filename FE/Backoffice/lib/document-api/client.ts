import { z } from 'zod'
import {
  documentTypeFieldResponseSchema,
  documentTypeResponseSchema,
  documentViewModelResponseSchema,
  documentFileResponseSchema,
  reportFieldResponseSchema,
  reportResponseSchema,
  reportListItemResponseSchema,
  type DocumentFieldFormValues,
  type DocumentFileResponse,
  type DocumentTypeFieldResponse,
  type DocumentTypeResponse,
  type DocumentViewModelResponse,
  type ReportFieldResponse,
  type ReportListItemResponse,
  type ReportResponse,
} from './schemas'

const API_PROXY_BASE = '/api/document-api'

export const documentApiKeys = {
  all: ['document-api'] as const,
  documentTypes: () => [...documentApiKeys.all, 'document-types'] as const,
  documentTypeViewModel: (documentTypeId: string | null) =>
    [...documentApiKeys.all, 'document-type-view-model', documentTypeId] as const,
  reports: (filters: ListReportsParams) => [...documentApiKeys.all, 'reports', filters] as const,
  report: (reportId: string | null) => [...documentApiKeys.all, 'report', reportId] as const,
  reportViewModel: (reportId: string | null) => [...documentApiKeys.all, 'report-view-model', reportId] as const,
}

export class DocumentApiError extends Error {
  readonly status: number
  readonly details: unknown

  constructor(message: string, status: number, details: unknown) {
    super(message)
    this.name = 'DocumentApiError'
    this.status = status
    this.details = details
  }
}

export interface ListReportsParams {
  organizationId?: string
  documentTypeId?: string
  status?: string
  reviewStatus?: string
  limit?: number
  offset?: number
}

export interface DocumentTypeFieldPayload {
  fieldKey: string
  label: string
  dataType: string
  isRequired: boolean
  sortOrder: number
  options: Record<string, unknown> | null
}

export type UpdateDocumentTypeFieldPayload = Omit<DocumentTypeFieldPayload, 'fieldKey'>

export interface UpdateReportPayload {
  customerId?: string | null
  siteId?: string | null
  caseId?: string | null
  reportNumber?: string | null
  title?: string | null
  status?: string | null
  reviewStatus?: string | null
  reviewScore?: number | null
  payload?: Record<string, unknown> | null
}

export interface DocumentFilePayload {
  purpose: string
  storageAccountName: string
  containerName: string
  blobName: string
  blobVersionId?: string | null
  fileName: string
  contentType: string
  fileSizeBytes: number
  sha256Hash?: string | null
  createdByUserId?: string | null
}

export interface ReportFieldPayload {
  fieldKey: string
  instanceIndex: number
  label: string
  dataType: string
  rawValue?: string | null
  normalizedValue?: string | null
  correctedValue?: string | null
  value?: Record<string, unknown> | null
  confidence?: number | null
  status: string
  source: string
  boundingRegions?: Record<string, unknown> | null
  correctedByUserId?: string | null
}

export async function listDocumentTypes(): Promise<DocumentTypeResponse[]> {
  return fetchDocumentApi('/document-types', z.array(documentTypeResponseSchema))
}

export async function getDocumentTypeViewModel(documentTypeId: string): Promise<DocumentViewModelResponse> {
  return fetchDocumentApi(`/document-types/${documentTypeId}/view-model`, documentViewModelResponseSchema)
}

export async function listReports(params: ListReportsParams = {}): Promise<ReportListItemResponse[]> {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  }

  const suffix = search.size > 0 ? `?${search.toString()}` : ''
  return fetchDocumentApi(`/reports${suffix}`, z.array(reportListItemResponseSchema))
}

export async function getReportViewModel(reportId: string): Promise<DocumentViewModelResponse> {
  return fetchDocumentApi(`/reports/${reportId}/view-model`, documentViewModelResponseSchema)
}

export async function getReport(reportId: string): Promise<ReportResponse> {
  return fetchDocumentApi(`/reports/${reportId}`, reportResponseSchema)
}

export async function updateReport(reportId: string, payload: UpdateReportPayload): Promise<ReportResponse> {
  return fetchDocumentApi(`/reports/${reportId}`, reportResponseSchema, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function addReportFile(reportId: string, payload: DocumentFilePayload): Promise<DocumentFileResponse> {
  return fetchDocumentApi(`/reports/${reportId}/files`, documentFileResponseSchema, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function uploadReportFiles(
  reportId: string,
  files: File[],
  purpose = 'Attachment',
): Promise<DocumentFileResponse[]> {
  const formData = new FormData()
  formData.set('purpose', purpose)
  for (const file of files) {
    formData.append('files', file)
  }

  return fetchDocumentApi(`/reports/${reportId}/files/upload`, z.array(documentFileResponseSchema), {
    method: 'POST',
    body: formData,
  })
}

export function reportFileContentUrl(reportId: string, fileId: string): string {
  return `${API_PROXY_BASE}/reports/${reportId}/files/${fileId}/content`
}

export async function deleteReportFile(reportId: string, fileId: string): Promise<void> {
  await fetchDocumentApi(`/reports/${reportId}/files/${fileId}`, z.undefined(), {
    method: 'DELETE',
  })
}

export async function upsertReportField(reportId: string, payload: ReportFieldPayload): Promise<ReportFieldResponse> {
  return fetchDocumentApi(`/reports/${reportId}/fields`, reportFieldResponseSchema, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function addDocumentTypeField(
  documentTypeId: string,
  payload: DocumentTypeFieldPayload,
): Promise<DocumentTypeFieldResponse> {
  return fetchDocumentApi(`/document-types/${documentTypeId}/fields`, documentTypeFieldResponseSchema, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateDocumentTypeField(
  documentTypeId: string,
  fieldKey: string,
  payload: UpdateDocumentTypeFieldPayload,
): Promise<DocumentTypeFieldResponse> {
  return fetchDocumentApi(`/document-types/${documentTypeId}/fields/${encodeURIComponent(fieldKey)}`, documentTypeFieldResponseSchema, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteDocumentTypeField(documentTypeId: string, fieldKey: string): Promise<void> {
  await fetchDocumentApi(`/document-types/${documentTypeId}/fields/${encodeURIComponent(fieldKey)}`, z.undefined(), {
    method: 'DELETE',
  })
}

export function formValuesToFieldPayload(values: DocumentFieldFormValues): DocumentTypeFieldPayload {
  return {
    fieldKey: values.fieldKey.trim(),
    label: values.label.trim(),
    dataType: values.dataType,
    isRequired: values.isRequired,
    sortOrder: values.sortOrder,
    options: parseOptionsJson(values.optionsJson),
  }
}

export function formatOptionsJson(options: Record<string, unknown> | null): string {
  return options ? JSON.stringify(options, null, 2) : ''
}

async function fetchDocumentApi<T>(
  path: string,
  schema: z.ZodType<T>,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData
  headers.set('Accept', 'application/json')
  if (init.body && !isFormData) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_PROXY_BASE}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    throw await toDocumentApiError(response)
  }

  if (response.status === 204) {
    return schema.parse(undefined)
  }

  const text = await response.text()
  const payload = text ? JSON.parse(text) : undefined
  return schema.parse(payload)
}

async function toDocumentApiError(response: Response): Promise<DocumentApiError> {
  const text = await response.text()
  let details: unknown = text

  if (text) {
    try {
      details = JSON.parse(text)
    } catch {
      details = text
    }
  }

  const message =
    typeof details === 'object' &&
    details !== null &&
    'message' in details &&
    typeof details.message === 'string'
      ? details.message
      : `DocumentApi svarede med HTTP ${response.status}`

  return new DocumentApiError(message, response.status, details)
}

function parseOptionsJson(value: string): Record<string, unknown> | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = JSON.parse(trimmed)
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Options skal være et JSON object')
  }

  return parsed as Record<string, unknown>
}
