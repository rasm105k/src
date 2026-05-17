'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { documentApiKeys, getReportViewModel } from '@/lib/document-api/client'
import {
  ApiErrorNotice,
  EmptyState,
  InlineLoading,
  Metric,
  PageShell,
  Panel,
} from '@/app/admin/_components/admin-ui'
import {
  calculateReportStats,
  ReportFieldTable,
  ReportFileList,
  ReportStatusBadge,
  ScoreBadge,
} from '../_components/report-ui'

export default function ReportDetailPage() {
  const params = useParams<{ reportId: string }>()
  const reportId = params.reportId
  const reportQuery = useQuery({
    queryKey: documentApiKeys.reportViewModel(reportId),
    queryFn: () => getReportViewModel(reportId),
    enabled: Boolean(reportId),
  })

  if (reportQuery.isLoading) {
    return (
      <PageShell>
        <InlineLoading label="Henter rapport..." />
      </PageShell>
    )
  }

  if (reportQuery.error) {
    return (
      <PageShell>
        <Link href="/rapporter" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700">
          <ArrowLeft size={14} />
          Tilbage til rapporter
        </Link>
        <ApiErrorNotice error={reportQuery.error} />
      </PageShell>
    )
  }

  const viewModel = reportQuery.data

  if (!viewModel) {
    return (
      <PageShell>
        <Link href="/rapporter" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700">
          <ArrowLeft size={14} />
          Tilbage til rapporter
        </Link>
        <EmptyState
          title="Rapporten blev ikke fundet"
          text="DocumentApi returnerede ikke en rapport med dette ID."
        />
      </PageShell>
    )
  }

  const stats = calculateReportStats(viewModel)

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/rapporter" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700">
            <ArrowLeft size={14} />
            Tilbage til rapporter
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            {viewModel.title || viewModel.reportNumber || viewModel.documentTypeName}
          </h1>
          <p className="mt-1 font-mono text-sm text-gray-400">
            {viewModel.reportNumber ?? viewModel.reportId ?? reportId}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReportStatusBadge value={viewModel.status} />
          <ReportStatusBadge value={viewModel.reviewStatus} />
          <ScoreBadge score={viewModel.reviewScore} />
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Metric label="Felter" value={stats.total} />
        <Metric label="Mangler" value={stats.missing} />
        <Metric label="Kræver review" value={stats.needsReview} />
        <Metric label="Lav confidence" value={stats.lowConfidence} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main>
          <ReportFieldTable viewModel={viewModel} />
        </main>

        <aside className="space-y-4">
          <Panel title="Rapportdata" subtitle={`${viewModel.documentTypeCode} v${viewModel.documentTypeVersion}`}>
            <div className="space-y-3 text-sm">
              <MetaRow label="Rapport ID" value={viewModel.reportId ?? '-'} />
              <MetaRow label="Dokumenttype ID" value={viewModel.documentTypeId} />
              <MetaRow label="Organisation" value={viewModel.organizationId ?? '-'} />
              <MetaRow label="Kunde" value={viewModel.customerId ?? '-'} />
              <MetaRow label="Sag" value={viewModel.caseId ?? '-'} />
              <MetaRow label="Original fil" value={viewModel.originalFileId ?? '-'} />
              <MetaRow label="Genereret PDF" value={viewModel.generatedPdfFileId ?? '-'} />
            </div>
          </Panel>

          <Panel
            title="Filer"
            subtitle={`${viewModel.files.length} blob-reference${viewModel.files.length === 1 ? '' : 'r'}`}
            actions={
              viewModel.originalFileId && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <ExternalLink size={12} />
                  Azure Blob
                </span>
              )
            }
          >
            <ReportFileList viewModel={viewModel} />
          </Panel>
        </aside>
      </div>
    </PageShell>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="mt-0.5 truncate font-mono text-xs text-gray-700">{value}</p>
    </div>
  )
}
