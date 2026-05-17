'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, RefreshCw, Search } from 'lucide-react'
import { documentApiKeys, listReports } from '@/lib/document-api/client'
import type { ReportListItemResponse } from '@/lib/document-api/schemas'
import {
  ApiErrorNotice,
  EmptyState,
  formatDate,
  LoadingRows,
  Metric,
  PageShell,
  Panel,
} from '@/app/admin/_components/admin-ui'
import { ReportStatusBadge, ScoreBadge } from './_components/report-ui'

const ALL = 'all'

export default function ReportsPage() {
  const [search, setSearch] = useState('')
  const [documentTypeFilter, setDocumentTypeFilter] = useState(ALL)
  const [reviewStatusFilter, setReviewStatusFilter] = useState(ALL)

  const reportsQuery = useQuery({
    queryKey: documentApiKeys.reports({ limit: 200 }),
    queryFn: () => listReports({ limit: 200 }),
  })

  const reports = reportsQuery.data ?? []
  const filtered = useMemo(
    () => filterReports(reports, { search, documentTypeFilter, reviewStatusFilter }),
    [reports, search, documentTypeFilter, reviewStatusFilter],
  )
  const documentTypes = useMemo(() => uniqueDocumentTypes(reports), [reports])
  const reviewStatuses = useMemo(() => [...new Set(reports.map(report => report.reviewStatus))].sort(), [reports])
  const needsReviewCount = reports.filter(report => report.reviewStatus === 'NeedsReview').length
  const approvedCount = reports.filter(report => report.reviewStatus === 'Approved').length
  const averageScore = averageReviewScore(reports)

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rapporter</h1>
          <p className="mt-1 text-sm text-gray-500">
            Faktiske rapporter fra DocumentApi med reviewstatus, confidence score og link til detailvisning.
          </p>
        </div>
        <button
          type="button"
          onClick={() => reportsQuery.refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <RefreshCw size={15} />
          Genindlæs
        </button>
      </div>

      {reportsQuery.error && (
        <div className="mb-4">
          <ApiErrorNotice error={reportsQuery.error} />
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Metric label="Rapporter" value={reports.length} />
        <Metric label="Kræver review" value={needsReviewCount} />
        <Metric label="Godkendt" value={approvedCount} />
        <Metric label="Gns. score" value={averageScore === null ? '-' : `${averageScore}%`} />
      </div>

      <Panel
        title="Rapportkø"
        subtitle={`${filtered.length} af ${reports.length} rapporter`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={documentTypeFilter}
              onChange={event => setDocumentTypeFilter(event.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            >
              <option value={ALL}>Alle dokumenttyper</option>
              {documentTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            <select
              value={reviewStatusFilter}
              onChange={event => setReviewStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            >
              <option value={ALL}>Alle reviewstatusser</option>
              {reviewStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Søg rapport..."
                className="w-64 rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>
          </div>
        }
      >
        {reportsQuery.isLoading ? (
          <LoadingRows count={8} />
        ) : filtered.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Rapport</th>
                    <th className="px-4 py-3">Dokumenttype</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Review</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Opdateret</th>
                    <th className="px-4 py-3 pr-6" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filtered.map(report => (
                    <ReportRow key={report.id} report={report} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Ingen rapporter matcher filtrene"
            text="Prøv at fjerne et filter eller genindlæs data fra DocumentApi."
          />
        )}
      </Panel>
    </PageShell>
  )
}

function ReportRow({ report }: { report: ReportListItemResponse }) {
  return (
    <tr className="transition-colors hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="min-w-0">
          <p className="font-medium text-gray-900">
            {report.title || report.reportNumber || 'Rapport uden titel'}
          </p>
          <p className="mt-0.5 font-mono text-xs text-gray-400">
            {report.reportNumber ?? report.id}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-gray-700">{report.documentTypeName}</p>
        <p className="mt-0.5 font-mono text-xs text-gray-400">{report.documentTypeCode}</p>
      </td>
      <td className="px-4 py-3">
        <ReportStatusBadge value={report.status} />
      </td>
      <td className="px-4 py-3">
        <ReportStatusBadge value={report.reviewStatus} />
      </td>
      <td className="px-4 py-3">
        <ScoreBadge score={report.reviewScore} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
        {formatDate(report.updatedAt)}
      </td>
      <td className="px-4 py-3 pr-6 text-right">
        <Link
          href={`/rapporter/${report.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Åbn
          <ArrowRight size={13} />
        </Link>
      </td>
    </tr>
  )
}

function filterReports(
  reports: ReportListItemResponse[],
  filters: { search: string; documentTypeFilter: string; reviewStatusFilter: string },
): ReportListItemResponse[] {
  const query = filters.search.trim().toLowerCase()

  return reports.filter(report => {
    if (filters.documentTypeFilter !== ALL && report.documentTypeId !== filters.documentTypeFilter) return false
    if (filters.reviewStatusFilter !== ALL && report.reviewStatus !== filters.reviewStatusFilter) return false
    if (!query) return true

    const haystack = [
      report.title,
      report.reportNumber,
      report.documentTypeName,
      report.documentTypeCode,
      report.status,
      report.reviewStatus,
      report.id,
    ].join(' ').toLowerCase()

    return haystack.includes(query)
  })
}

function uniqueDocumentTypes(reports: ReportListItemResponse[]) {
  const byId = new Map<string, { id: string; name: string }>()

  for (const report of reports) {
    byId.set(report.documentTypeId, {
      id: report.documentTypeId,
      name: report.documentTypeName,
    })
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function averageReviewScore(reports: ReportListItemResponse[]): number | null {
  const scores = reports
    .map(report => report.reviewScore)
    .filter((score): score is number => score !== null)

  if (scores.length === 0) return null

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}
