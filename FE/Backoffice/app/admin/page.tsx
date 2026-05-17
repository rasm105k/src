'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, FilePlus, Search } from 'lucide-react'
import { documentApiKeys, listDocumentTypes } from '@/lib/document-api/client'
import type { DocumentTypeResponse } from '@/lib/document-api/schemas'
import {
  ActiveBadge,
  ApiErrorNotice,
  EmptyState,
  formatDate,
  LoadingRows,
  Metric,
  PageShell,
  Panel,
} from './_components/admin-ui'

export default function AdminPage() {
  const [search, setSearch] = useState('')
  const documentTypesQuery = useQuery({
    queryKey: documentApiKeys.documentTypes(),
    queryFn: listDocumentTypes,
  })

  const documentTypes = documentTypesQuery.data ?? []
  const filtered = useMemo(() => filterDocumentTypes(documentTypes, search), [documentTypes, search])
  const totalFields = documentTypes.reduce((sum, type) => sum + type.fields.length, 0)
  const requiredFields = documentTypes.reduce(
    (sum, type) => sum + type.fields.filter(field => field.isRequired).length,
    0,
  )

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administrer dokumentmodeller og de felter, som DocumentApi eksponerer til frontend.
          </p>
        </div>
        <Link
          href="/opret-dokument"
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          <FilePlus size={15} />
          Opret dokument
        </Link>
      </div>

      {documentTypesQuery.error && (
        <div className="mb-4">
          <ApiErrorNotice error={documentTypesQuery.error} />
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Dokumenttyper" value={documentTypes.length} />
        <Metric label="Felter i alt" value={totalFields} />
        <Metric label="Obligatoriske felter" value={requiredFields} />
      </div>

      <Panel
        title="Dokumentmodeller"
        subtitle="Oversigt over oprettede dokumenttyper og feltdefinitioner"
        actions={
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Søg i modeller..."
              className="w-64 rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
          </div>
        }
      >
        {documentTypesQuery.isLoading ? (
          <LoadingRows count={6} />
        ) : filtered.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Dokumenttype</th>
                    <th className="px-4 py-3">Felter</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Opdateret</th>
                    <th className="px-4 py-3 pr-6" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filtered.map(type => (
                    <DocumentTypeRow key={type.id} type={type} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Ingen dokumentmodeller matcher søgningen"
            text="Prøv en anden søgning eller opret en ny dokumenttype via DocumentApi/Postman."
          />
        )}
      </Panel>
    </PageShell>
  )
}

function DocumentTypeRow({ type }: { type: DocumentTypeResponse }) {
  const requiredCount = type.fields.filter(field => field.isRequired).length
  const optionalCount = type.fields.length - requiredCount

  return (
    <tr className="transition-colors hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{type.name}</p>
          <p className="mt-0.5 font-mono text-xs text-gray-400">
            {type.code} · version {type.version}
          </p>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-600">
        <span className="font-medium text-gray-900">{type.fields.length}</span>
        <span className="ml-1 text-xs text-gray-400">
          {requiredCount} obligatoriske · {optionalCount} valgfrie
        </span>
      </td>
      <td className="px-4 py-3">
        <ActiveBadge active={type.isActive} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
        {formatDate(type.updatedAt)}
      </td>
      <td className="px-4 py-3 pr-6 text-right">
        <Link
          href={`/admin/${type.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Åbn
          <ArrowRight size={13} />
        </Link>
      </td>
    </tr>
  )
}

function filterDocumentTypes(types: DocumentTypeResponse[], search: string): DocumentTypeResponse[] {
  const query = search.trim().toLowerCase()
  if (!query) return types

  return types.filter(type => {
    const haystack = [
      type.name,
      type.code,
      type.version,
      ...type.fields.flatMap(field => [field.fieldKey, field.label, field.dataType]),
    ].join(' ').toLowerCase()

    return haystack.includes(query)
  })
}
