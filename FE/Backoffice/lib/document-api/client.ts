import { z } from 'zod'
import {
  documentTypeFieldResponseSchema,
  documentTypeResponseSchema,
  documentViewModelResponseSchema,
  reportListItemResponseSchema,
  type DocumentFieldFormValues,
  type DocumentTypeFieldResponse,
  type DocumentTypeResponse,
  type DocumentViewModelResponse,
  type ReportListItemResponse,
} from './schemas'

const API_PROXY_BASE = '/api/document-api'

export const documentApiKeys = {
  all: ['document-api'] as const,
  documentTypes: () => [...documentApiKeys.all, 'document-types'] as const,
  documentTypeViewModel: (documentTypeId: string | null) =>
    [...documentApiKeys.all, 'document-type-view-model', documentTypeId] as const,
  reports: (filters: ListReportsParams) => [...documentApiKeys.all, 'reports', filters] as const,
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
  headers.set('Accept', 'application/json')
  if (init.body) {
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
