'use client'

import { useMemo, useState } from 'react'
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Eye,
} from 'lucide-react'
import { generateMockWorkslips } from '@/lib/mock-data'
import type { Workslip, WorkslipStatus } from '@/lib/types'

const data = generateMockWorkslips(150)

const statusConfig: Record<WorkslipStatus, { label: string; icon: typeof Clock; color: string }> = {
  pending:    { label: 'Afventer',  icon: Clock,       color: 'text-yellow-600 bg-yellow-50 ring-yellow-500/20' },
  processing: { label: 'Behandler', icon: FileText,    color: 'text-blue-600 bg-blue-50 ring-blue-500/20' },
  completed:  { label: 'Færdig',    icon: CheckCircle2, color: 'text-green-600 bg-green-50 ring-green-500/20' },
  failed:     { label: 'Fejlet',    icon: XCircle,     color: 'text-red-600 bg-red-50 ring-red-500/20' },
}

type SortKey = keyof Workslip
type SortDir = 'asc' | 'desc'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('da-DK', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function StatusBadge({ status }: { status: WorkslipStatus }) {
  const cfg = statusConfig[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.color}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  )
}

export default function BackofficePage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<WorkslipStatus | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('submittedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selected, setSelected] = useState<Workslip | null>(null)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown size={12} className="text-gray-300" />
    return sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return data
      .filter(w => {
        if (statusFilter !== 'all' && w.status !== statusFilter) return false
        if (!q) return true
        return (
          w.customerName.toLowerCase().includes(q) ||
          w.projectName.toLowerCase().includes(q) ||
          w.id.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          w.customerEmail.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const aVal = String(a[sortKey] ?? '')
        const bVal = String(b[sortKey] ?? '')
        const cmp = aVal.localeCompare(bVal)
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [search, statusFilter, sortKey, sortDir])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.length }
    for (const s of ['pending', 'processing', 'completed', 'failed'] as const) {
      c[s] = data.filter(w => w.status === s).length
    }
    return c
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Workslips</h1>
        <p className="mt-1 text-sm text-gray-500">
          {filtered.length} af {data.length} workslips
        </p>
      </div>

      {/* Stats */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'pending', 'processing', 'completed', 'failed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? 'Alle' : statusConfig[s].label}
            <span className="ml-1.5 opacity-60">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Søg på navn, projekt, ID eller email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                {([
                  { key: 'id', label: 'ID' },
                  { key: 'customerName', label: 'Kunde' },
                  { key: 'projectName', label: 'Projekt' },
                  { key: 'status', label: 'Status' },
                  { key: 'fileName', label: 'Fil' },
                  { key: 'submittedAt', label: 'Indsendt' },
                ] as { key: SortKey; label: string }[]).map(col => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="cursor-pointer select-none px-3 py-3 first:pl-5 last:pr-5"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon column={col.key} />
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 pr-5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(w => (
                <tr
                  key={w.id}
                  onClick={() => setSelected(w)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-gray-400 first:pl-5">
                    {w.id}
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{w.customerName}</div>
                    <div className="text-xs text-gray-400">{w.customerEmail}</div>
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-3">
                    <div className="font-medium">{w.projectName}</div>
                    <div className="truncate text-xs text-gray-400">{w.description}</div>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={w.status} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="truncate text-xs">{w.fileName}</div>
                    <div className="text-xs text-gray-400">{formatSize(w.fileSize)}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-500">
                    {formatDate(w.submittedAt)}
                  </td>
                  <td className="px-3 py-3 pr-5">
                    <button
                      onClick={e => { e.stopPropagation(); setSelected(w) }}
                      className="rounded p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Search size={32} className="mb-2" />
            <p className="text-sm">Ingen workslips matchede din søgning</p>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            onClick={e => e.stopPropagation()}
            className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-semibold">{selected.id}</h2>
              <button
                onClick={() => setSelected(null)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <XCircle size={18} />
              </button>
            </div>
            <div className="flex-1 space-y-5 px-5 py-5 text-sm">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Status</span>
                <div className="mt-1">
                  <StatusBadge status={selected.status} />
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Kunde</span>
                <p className="mt-1 font-medium">{selected.customerName}</p>
                <p className="text-gray-500">{selected.customerEmail}</p>
                <p className="text-gray-500">{selected.customerPhone}</p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Projekt</span>
                <p className="mt-1 font-medium">{selected.projectName}</p>
                <p className="mt-0.5 text-gray-500">{selected.description}</p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Fil</span>
                <p className="mt-1 text-gray-600">{selected.fileName}</p>
                <p className="text-gray-400">{formatSize(selected.fileSize)}</p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tidslinje</span>
                <div className="mt-1 space-y-1 text-gray-500">
                  <p>Indsendt: {formatDate(selected.submittedAt)}</p>
                  {selected.processedAt && (
                    <p>Behandlet: {formatDate(selected.processedAt)}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800">
                <Download size={16} />
                Download fil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
