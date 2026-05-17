import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react'
import type { WorkslipStatus } from '@/lib/types'

export const statusConfig: Record<WorkslipStatus, { label: string; color: string }> = {
  pending:    { label: 'Afventer',  color: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20' },
  processing: { label: 'Behandler', color: 'text-blue-700 bg-blue-50 ring-blue-600/20' },
  completed:  { label: 'Færdig',    color: 'text-green-700 bg-green-50 ring-green-600/20' },
  failed:     { label: 'Fejlet',    color: 'text-red-700 bg-red-50 ring-red-600/20' },
}

export function StatusBadge({ status }: { status: WorkslipStatus }) {
  const cfg = statusConfig[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.color}`}>
      {status === 'pending' && <Clock size={12} />}
      {status === 'processing' && <FileText size={12} />}
      {status === 'completed' && <CheckCircle2 size={12} />}
      {status === 'failed' && <XCircle size={12} />}
      {cfg.label}
    </span>
  )
}

export type SortKey = 'reportNumber' | 'customerName' | 'address' | 'workKind' | 'status' | 'technicianName' | 'submittedAt' | 'reviewScore' | 'reviewStatus'
export type SortDir = 'asc' | 'desc'

export function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== column) return <ArrowUpDown size={12} className="text-gray-300" />
  return sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
}

export function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <Icon size={14} className="mt-0.5 shrink-0 text-gray-300" />
      <div className="min-w-0">
        <span className="text-xs text-gray-400">{label}</span>
        <p className="truncate text-sm text-gray-700">{value}</p>
      </div>
    </div>
  )
}

export function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-2.5 block">
      <span className="mb-1 block text-xs font-medium text-gray-400">{label}</span>
      {children}
    </label>
  )
}

export function StageCollapse({ title, checked, total, children }: { title: string; checked: number; total: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm"
      >
        <span className="font-medium text-gray-700">{title}</span>
        <span className="flex items-center gap-2 text-xs text-gray-400">
          {checked}/{total}
          <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
        </span>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-3 py-2">
          {children}
        </div>
      )}
    </div>
  )
}

export function escHtml(v: unknown): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
