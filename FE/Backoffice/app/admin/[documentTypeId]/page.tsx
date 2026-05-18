'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Loader2, Plus, Save, Search, Trash2 } from 'lucide-react'
import {
  addDocumentTypeField,
  deleteDocumentTypeField,
  documentApiKeys,
  formatOptionsJson,
  formValuesToFieldPayload,
  listDocumentTypes,
  updateDocumentTypeField,
  type UpdateDocumentTypeFieldPayload,
} from '@/lib/document-api/client'
import {
  documentFieldFormSchema,
  FIELD_DATA_TYPES,
  type DocumentFieldFormValues,
  type DocumentTypeFieldResponse,
} from '@/lib/document-api/schemas'
import {
  ActiveBadge,
  ApiErrorNotice,
  DataTypeBadge,
  EmptyState,
  FormField,
  formatDate,
  InlineLoading,
  LoadingRows,
  Metric,
  PageShell,
  Panel,
  RequiredBadge,
  apiErrorMessage,
} from '../_components/admin-ui'

const fieldDefaults: DocumentFieldFormValues = {
  fieldKey: '',
  label: '',
  dataType: 'Text',
  isRequired: false,
  sortOrder: 0,
  optionsJson: '',
}

export default function AdminDocumentTypeDetailPage() {
  const params = useParams<{ documentTypeId: string }>()
  const documentTypeId = params.documentTypeId
  const queryClient = useQueryClient()
  const [fieldSearch, setFieldSearch] = useState('')
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const documentTypesQuery = useQuery({
    queryKey: documentApiKeys.documentTypes(),
    queryFn: listDocumentTypes,
  })

  const documentType = useMemo(
    () => documentTypesQuery.data?.find(type => type.id === documentTypeId) ?? null,
    [documentTypesQuery.data, documentTypeId],
  )
  const fields = useMemo(
    () => [...(documentType?.fields ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.fieldKey.localeCompare(b.fieldKey)),
    [documentType],
  )
  const filteredFields = useMemo(() => filterFields(fields, fieldSearch), [fields, fieldSearch])
  const requiredCount = fields.filter(field => field.isRequired).length
  const nextSortOrder = useMemo(() => {
    const maxSortOrder = fields.reduce((max, field) => Math.max(max, field.sortOrder), 0)
    return maxSortOrder + 10
  }, [fields])

  const form = useForm<DocumentFieldFormValues>({
    resolver: zodResolver(documentFieldFormSchema),
    defaultValues: fieldDefaults,
  })

  function resetFieldForm() {
    setEditingFieldKey(null)
    form.reset({ ...fieldDefaults, sortOrder: nextSortOrder })
    setMessage(null)
  }

  useEffect(() => {
    if (!editingFieldKey) {
      form.reset({ ...fieldDefaults, sortOrder: nextSortOrder })
    }
  }, [editingFieldKey, form, nextSortOrder])

  const invalidateDocumentTypes = async () => {
    await queryClient.invalidateQueries({ queryKey: documentApiKeys.documentTypes() })
  }

  const addFieldMutation = useMutation({
    mutationFn: (values: DocumentFieldFormValues) =>
      addDocumentTypeField(documentTypeId, formValuesToFieldPayload(values)),
    onSuccess: async field => {
      setEditingFieldKey(field.fieldKey)
      form.reset(fieldToFormValues(field))
      setMessage({ tone: 'success', text: `Feltet "${field.label}" blev oprettet.` })
      await invalidateDocumentTypes()
    },
    onError: error => setMessage({ tone: 'error', text: apiErrorMessage(error) }),
  })

  const updateFieldMutation = useMutation({
    mutationFn: ({ fieldKey, values }: { fieldKey: string; values: DocumentFieldFormValues }) => {
      const payload = formValuesToFieldPayload(values)
      const updatePayload: UpdateDocumentTypeFieldPayload = {
        label: payload.label,
        dataType: payload.dataType,
        isRequired: payload.isRequired,
        sortOrder: payload.sortOrder,
        options: payload.options,
      }

      return updateDocumentTypeField(documentTypeId, fieldKey, updatePayload)
    },
    onSuccess: async field => {
      form.reset(fieldToFormValues(field))
      setMessage({ tone: 'success', text: `Feltet "${field.label}" blev opdateret.` })
      await invalidateDocumentTypes()
    },
    onError: error => setMessage({ tone: 'error', text: apiErrorMessage(error) }),
  })

  const deleteFieldMutation = useMutation({
    mutationFn: (fieldKey: string) => deleteDocumentTypeField(documentTypeId, fieldKey),
    onSuccess: async () => {
      setEditingFieldKey(null)
      form.reset({ ...fieldDefaults, sortOrder: nextSortOrder })
      setMessage({ tone: 'success', text: 'Feltet blev slettet.' })
      await invalidateDocumentTypes()
    },
    onError: error => setMessage({ tone: 'error', text: apiErrorMessage(error) }),
  })

  const isSaving = addFieldMutation.isPending || updateFieldMutation.isPending || deleteFieldMutation.isPending

  function editField(field: DocumentTypeFieldResponse) {
    setEditingFieldKey(field.fieldKey)
    form.reset(fieldToFormValues(field))
    setMessage(null)
  }

  function submitField(values: DocumentFieldFormValues) {
    if (editingFieldKey) {
      updateFieldMutation.mutate({ fieldKey: editingFieldKey, values })
      return
    }

    addFieldMutation.mutate(values)
  }

  function deleteSelectedField() {
    if (!editingFieldKey) return
    const confirmed = window.confirm(`Slet feltet "${editingFieldKey}" fra denne dokumentmodel?`)
    if (!confirmed) return

    deleteFieldMutation.mutate(editingFieldKey)
  }

  if (documentTypesQuery.isLoading) {
    return (
      <PageShell>
        <InlineLoading label="Henter dokumentmodel..." />
      </PageShell>
    )
  }

  if (documentTypesQuery.error) {
    return (
      <PageShell>
        <ApiErrorNotice error={documentTypesQuery.error} />
      </PageShell>
    )
  }

  if (!documentType) {
    return (
      <PageShell>
        <Link href="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700">
          <ArrowLeft size={14} />
          Tilbage til admin
        </Link>
        <EmptyState
          title="Dokumentmodellen blev ikke fundet"
          text="DocumentApi returnerede ikke en dokumenttype med dette ID."
          kind="fields"
        />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700">
            <ArrowLeft size={14} />
            Tilbage til admin
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{documentType.name}</h1>
            <ActiveBadge active={documentType.isActive} />
          </div>
          <p className="mt-1 font-mono text-sm text-gray-400">
            {documentType.code} · version {documentType.version}
          </p>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Felter" value={fields.length} />
        <Metric label="Obligatoriske" value={requiredCount} />
        <Metric label="Sidst opdateret" value={formatDate(documentType.updatedAt)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel
          title="Felter på dokumentmodellen"
          subtitle="Klik på et felt for at redigere det"
          actions={
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={fieldSearch}
                onChange={event => setFieldSearch(event.target.value)}
                placeholder="Søg i felter..."
                className="w-64 rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>
          }
        >
          {documentTypesQuery.isFetching && !documentType ? (
            <LoadingRows />
          ) : filteredFields.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3">Felt</th>
                      <th className="px-4 py-3">Datatype</th>
                      <th className="px-4 py-3">Krav</th>
                      <th className="px-4 py-3">Sortering</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredFields.map(field => (
                      <tr
                        key={field.id}
                        onClick={() => editField(field)}
                        className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                          editingFieldKey === field.fieldKey ? 'bg-gray-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{field.label}</p>
                          <p className="mt-0.5 font-mono text-xs text-gray-400">{field.fieldKey}</p>
                        </td>
                        <td className="px-4 py-3">
                          <DataTypeBadge value={field.dataType} />
                        </td>
                        <td className="px-4 py-3">
                          <RequiredBadge required={field.isRequired} />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                          {field.sortOrder}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Ingen felter matcher"
              text="Prøv en anden søgning eller opret et nyt felt på dokumentmodellen."
              kind="fields"
            />
          )}
        </Panel>

        <Panel
          title={editingFieldKey ? 'Rediger felt' : 'Opret felt'}
          subtitle={editingFieldKey ?? 'Nyt felt på dokumentmodellen'}
        >
          <form onSubmit={form.handleSubmit(submitField)} className="space-y-3">
            <FormField label="Felt-key" error={form.formState.errors.fieldKey?.message}>
              <input
                {...form.register('fieldKey')}
                readOnly={Boolean(editingFieldKey)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100 read-only:bg-gray-50 read-only:text-gray-500"
                placeholder="customer.name"
              />
            </FormField>

            <FormField label="Label" error={form.formState.errors.label?.message}>
              <input
                {...form.register('label')}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                placeholder="Kundenavn"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Datatype" error={form.formState.errors.dataType?.message}>
                <select
                  {...form.register('dataType')}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                >
                  {FIELD_DATA_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Sortering" error={form.formState.errors.sortOrder?.message}>
                <input
                  type="number"
                  min="0"
                  {...form.register('sortOrder', { valueAsNumber: true })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </FormField>
            </div>

            <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                {...form.register('isRequired')}
                className="h-4 w-4 rounded border-gray-300 text-gray-900"
              />
              Obligatorisk felt
            </label>

            <FormField label="Options JSON" error={form.formState.errors.optionsJson?.message}>
              <textarea
                {...form.register('optionsJson')}
                rows={5}
                className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                placeholder='{"choices":["Ja","Nej"]}'
              />
            </FormField>

            {message && (
              <div className={`rounded-lg border px-3 py-2 text-xs ${
                message.tone === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-green-200 bg-green-50 text-green-700'
              }`}>
                {message.text}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {editingFieldKey ? 'Gem felt' : 'Opret felt'}
              </button>

              {editingFieldKey && (
                <button
                  type="button"
                  onClick={deleteSelectedField}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2.5 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Slet felt"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </form>
        </Panel>
      </div>
    </PageShell>
  )
}

function fieldToFormValues(field: DocumentTypeFieldResponse): DocumentFieldFormValues {
  return {
    fieldKey: field.fieldKey,
    label: field.label,
    dataType: field.dataType,
    isRequired: field.isRequired,
    sortOrder: field.sortOrder,
    optionsJson: formatOptionsJson(field.options),
  }
}

function filterFields(fields: DocumentTypeFieldResponse[], search: string): DocumentTypeFieldResponse[] {
  const query = search.trim().toLowerCase()
  if (!query) return fields

  return fields.filter(field => {
    const haystack = [field.fieldKey, field.label, field.dataType, field.sortOrder].join(' ').toLowerCase()
    return haystack.includes(query)
  })
}
