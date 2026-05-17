'use client'

import { useMemo, useState, useRef } from 'react'
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Building2,
  Wrench,
  ClipboardCheck,
  Flag,
  FileSignature,
  CalendarDays,
  Phone,
  User,
  MapPin,
  FileText,
  Check,
  Upload,
  Pencil,
  Save,
  X,
  Loader2,
  UploadCloud,
  Download,
} from 'lucide-react'
import {
  generateMockWorkslips,
  generateScannedWorkslip,
  installationTypeLabels,
  workKindLabels,
  closureFlagLabels,
  controlStageDefs,
  installationToControlColumns,
} from '@/lib/mock-data'
import { openQControlReport, openCombinedQControlReport } from '@/lib/q-control-report'
import type { Workslip, WorkslipStatus, InstallationType, ClosureFlag, WorkKind } from '@/lib/types'

const statusConfig: Record<WorkslipStatus, { label: string; color: string }> = {
  pending:    { label: 'Afventer',  color: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20' },
  processing: { label: 'Behandler', color: 'text-blue-700 bg-blue-50 ring-blue-600/20' },
  completed:  { label: 'Færdig',    color: 'text-green-700 bg-green-50 ring-green-600/20' },
  failed:     { label: 'Fejlet',    color: 'text-red-700 bg-red-50 ring-red-600/20' },
}


const instColors: Record<InstallationType, string> = {
  gas:  'text-orange-700 bg-orange-50 ring-orange-600/20',
  vand: 'text-cyan-700 bg-cyan-50 ring-cyan-600/20',
  aflob:'text-stone-700 bg-stone-50 ring-stone-600/20',
  varme:'text-rose-700 bg-rose-50 ring-rose-600/20',
}

type SortKey = 'reportNumber' | 'customerName' | 'address' | 'workKind' | 'status' | 'technicianName' | 'submittedAt' | 'reviewScore' | 'reviewStatus'
type SortDir = 'asc' | 'desc'

const instList: InstallationType[] = ['gas', 'vand', 'aflob', 'varme']
const workKindList: WorkKind[] = ['nyInstallation', 'aendring', 'reparation', 'serviceAndet']
const closureFlagList: ClosureFlag[] = ['ikkeFaerdig', 'faerdig', 'tegninger', 'faerdigmelding', 'driftVedligehold', 'klarTilFaktura']

interface VersionEntry {
  version: number
  at: string
  actor: string
  changes: { field: string; oldValue: string; newValue: string }[]
}

const allStatuses: WorkslipStatus[] = ['pending', 'processing', 'completed', 'failed']

function StatusBadge({ status }: { status: WorkslipStatus }) {
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


function openWrittenReport(workslip: Workslip): void {
  const popup = window.open('', '_blank', 'width=900,height=800')
  if (!popup) return

  const statusLabel = statusConfig[workslip.status].label

  popup.document.open()
  popup.document.write(`<!doctype html>
<html lang="da">
<head>
  <meta charset="utf-8" />
  <title>Skriftlig rapport - ${workslip.reportNumber}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f3f4f6;
      color: #111827;
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1.6;
      font-size: 13px;
    }
    .page {
      max-width: 210mm;
      margin: 20px auto;
      background: white;
      padding: 22mm 24mm;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      min-height: 297mm;
    }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .subtitle { color: #6b7280; font-size: 13px; margin: 0 0 20px; }
    h2 {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
      margin: 20px 0 10px;
    }
    .field { margin-bottom: 6px; }
    .field dt { color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
    .field dd { margin: 0 0 0 12px; font-size: 13px; }
    .sep { margin: 20px 0; border: 0; border-top: 1px solid #e5e7eb; }
    p { margin: 0 0 8px; }
    .pill {
      display: inline-block;
      border: 1px solid #d1d5db;
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 11px;
      margin: 2px 4px 2px 0;
    }
    .tag {
      display: inline-block;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      padding: 1px 6px;
      font-size: 11px;
      margin: 1px 3px 1px 0;
    }
    .meta { color: #6b7280; font-family: Arial, sans-serif; font-size: 12px; }
    .actions {
      position: sticky; top: 0; display: flex; justify-content: center; gap: 8px;
      background: rgba(243,244,246,0.9); backdrop-filter: blur(8px); padding: 12px;
    }
    .actions button {
      border: 0; border-radius: 8px; background: #111827; color: white;
      cursor: pointer; font-weight: 700; padding: 10px 14px;
    }
    @page { size: A4; margin: 16mm; }
    @media print {
      body { background: white; }
      .actions { display: none; }
      .page { box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button onclick="window.print()">Gem som PDF / print</button>
  </div>
  <div class="page">
    <h1>Skriftlig rapport</h1>
    <p class="subtitle">${workslip.reportNumber} &mdash; ${statusLabel}</p>

    <h2>Kunde og adresse</h2>
    <p>${escHtml(workslip.customerName)}<br/>
    ${escHtml(workslip.address)}<br/>
    Att.: ${escHtml(workslip.contactPerson)}<br/>
    Tlf.: ${escHtml(workslip.phone)}</p>

    <h2>Arbejdet</h2>
    <p><strong>Montør:</strong> ${escHtml(workslip.technicianName)}<br/>
    <strong>Dato:</strong> ${new Date(workslip.date).toLocaleDateString('da-DK', { day: '2-digit', month: 'long', year: 'numeric' })}<br/>
    <strong>Anlægstype:</strong> ${workslip.installationTypes.map(t => installationTypeLabels[t]).join(', ')}<br/>
    <strong>Arbejdstype:</strong> ${workslip.workKind === 'serviceAndet' ? escHtml(workslip.customWorkKind) : workKindLabels[workslip.workKind]}</p>
    <p><strong>Beskrivelse:</strong><br/>${escHtml(workslip.description)}</p>
    ${workslip.customerInfo ? `<p><strong>Oplysninger til kunden:</strong><br/>${escHtml(workslip.customerInfo)}</p>` : ''}

    <h2>Kontrolpunkter</h2>
    ${workslip.controlStages.map(s =>
      `<p><strong>${escHtml(s.stageTitle)}</strong> (${s.checkedItems.length}/${s.totalItems})<br/>
      ${s.checkedItems.length > 0 ? s.checkedItems.map(i => escHtml(i.label)).join('<br/>') : '<span style="color:#9ca3af">Ingen markeret</span>'}</p>`
    ).join('')}
    ${workslip.remarks ? `<h2>Bemærkninger</h2><p>${escHtml(workslip.remarks)}</p>` : ''}

    <h2>Afslutning</h2>
    <p>${workslip.closureFlags.map(f => `<span class="pill">${closureFlagLabels[f]}</span>`).join('') || 'Ingen'}</p>

    <h2>Underskrift</h2>
    <p><strong>Montør:</strong> ${escHtml(workslip.technicianName)}<br/>
    <strong>Dato:</strong> ${new Date(workslip.signatureDate).toLocaleDateString('da-DK', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

    <hr class="sep" />
    <p class="meta">Rapporten er genereret fra Workslip &mdash; ${new Date().toLocaleString('da-DK')}</p>
  </div>
</body>
</html>`)
  popup.document.close()
  popup.focus()
}

function escHtml(v: unknown): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function sortValue(workslip: Workslip, key: SortKey): string | number | null {
  if (key === 'reviewScore') return workslip.scanReview?.score ?? -1
  if (key === 'reviewStatus') return workslip.scanReview?.status ?? ''
  return workslip[key] ?? ''
}

export default function BackofficePage() {
  const [workslips, setWorkslips] = useState(() => generateMockWorkslips(150))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<WorkslipStatus | 'all'>('all')

  const [sortKey, setSortKey] = useState<SortKey>('submittedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selected, setSelected] = useState<Workslip | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editDraft, setEditDraft] = useState<Workslip | null>(null)
  const [versionHistory, setVersionHistory] = useState<Record<string, VersionEntry[]>>({})
  const [showVersions, setShowVersions] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importFiles, setImportFiles] = useState<File[]>([])
  const [importing, setImporting] = useState(false)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown size={12} className="text-gray-300" />
    return sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return workslips
      .filter(w => {
        if (statusFilter !== 'all' && w.status !== statusFilter) return false
        if (!q) return true
        return (
          w.customerName.toLowerCase().includes(q) ||
          w.reportNumber.toLowerCase().includes(q) ||
          w.contactPerson.toLowerCase().includes(q) ||
          w.address.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          w.technicianName.toLowerCase().includes(q) ||
          (w.scanReview?.originalFileName.toLowerCase().includes(q) ?? false)
        )
      })
      .sort((a, b) => {
        const aVal = sortValue(a, sortKey)
        const bVal = sortValue(b, sortKey)
        const cmp = typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal ?? '').localeCompare(String(bVal ?? ''))
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [search, statusFilter, sortKey, sortDir, workslips])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: workslips.length }
    for (const s of allStatuses) c[s] = workslips.filter(w => w.status === s).length
    return c
  }, [workslips])

  function openDetail(w: Workslip) {
    setSelected(w)
    setEditMode(false)
    setEditDraft(null)
  }

  function startEdit() {
    if (!selected) return
    setEditDraft({ ...selected })
    setEditMode(true)
  }

  function cancelEdit() {
    setEditMode(false)
    setEditDraft(null)
  }

  function saveEdit() {
    if (!editDraft || !selected) return
    const changes: VersionEntry['changes'] = []
    const tracked: (keyof Workslip)[] = ['customerName', 'contactPerson', 'phone', 'address', 'date', 'description', 'customerInfo', 'remarks', 'technicianName', 'signatureDate', 'workKind', 'customWorkKind']
    for (const field of tracked) {
      const oldVal = String(selected[field] ?? '')
      const newVal = String(editDraft[field] ?? '')
      if (oldVal !== newVal) {
        changes.push({ field, oldValue: oldVal, newValue: newVal })
      }
    }
    const now = new Date().toISOString()
    const entry: VersionEntry = {
      version: (versionHistory[selected.id]?.length ?? 0) + 1,
      at: now,
      actor: 'Admin',
      changes,
    }
    setVersionHistory(prev => ({
      ...prev,
      [selected.id]: [...(prev[selected.id] ?? []), entry],
    }))
    setWorkslips(prev => prev.map(w => w.id === editDraft.id ? editDraft : w))
    setSelected(editDraft)
    setEditMode(false)
    setEditDraft(null)
  }

  function updateDraft(field: keyof Workslip, value: any) {
    setEditDraft(prev => prev ? { ...prev, [field]: value } : null)
  }


  function toggleDraftInstallation(type: InstallationType) {
    setEditDraft(prev => {
      if (!prev) return prev
      const current = prev.installationTypes
      return {
        ...prev,
        installationTypes: current.includes(type)
          ? current.filter(t => t !== type)
          : [...current, type],
      }
    })
  }

  function toggleDraftClosure(flag: ClosureFlag) {
    setEditDraft(prev => {
      if (!prev) return prev
      const current = prev.closureFlags
      if (flag === 'ikkeFaerdig') {
        return { ...prev, closureFlags: current.includes('ikkeFaerdig') ? [] : ['ikkeFaerdig'] }
      }
      const without = current.filter(f => f !== 'ikkeFaerdig')
      return {
        ...prev,
        closureFlags: without.includes(flag) ? without.filter(f => f !== flag) : [...without, flag],
      }
    })
  }

  function toggleDraftControlItem(stageId: string, item: { id: string; label: string }) {
    setEditDraft(prev => {
      if (!prev) return prev
      return {
        ...prev,
        controlStages: prev.controlStages.map(stage =>
          stage.stageId === stageId
            ? {
                ...stage,
                checkedItems: stage.checkedItems.some(c => c.id === item.id)
                  ? stage.checkedItems.filter(c => c.id !== item.id)
                  : [...stage.checkedItems, item],
              }
            : stage
        ),
      }
    })
  }

  // ─── Import ─────────────────────────────────

  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleImportFiles(files: FileList | null) {
    if (!files) return
    setImportFiles(prev => [...prev, ...Array.from(files)])
  }

  function removeImportFile(index: number) {
    setImportFiles(prev => prev.filter((_, i) => i !== index))
  }

  function runImport() {
    if (importFiles.length === 0) return
    setImporting(true)
    const newWorkslips = importFiles.map(f => generateScannedWorkslip(f.name))
    setTimeout(() => {
      setWorkslips(prev => [...newWorkslips, ...prev])
      setImportFiles([])
      setImporting(false)
      setShowImport(false)
    }, 1200)
  }



  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workslips</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} af {workslips.length} rapporter
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openCombinedQControlReport(filtered)}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} />
            Samlet udtræk
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            <Upload size={16} />
            Importér dokumenter
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(['all', ...allStatuses] as const).map(s => (
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
        <div className="relative ml-auto">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Søg på kunde, rapportnr., adresse…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-72 rounded-lg border border-gray-200 bg-white py-1.5 pl-9 pr-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                {([
                  { key: 'reportNumber', label: 'Rapport' },
                  { key: 'customerName', label: 'Kunde' },
                  { key: 'address', label: 'Adresse' },
                  { key: 'status', label: 'Status' },
                  { key: 'submittedAt', label: 'Indsendt' },
                ] as { key: SortKey; label: string }[]).map(col => (<th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="cursor-pointer select-none px-4 py-3 first:pl-6 last:pr-6"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon column={col.key} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 pr-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(w => (
                <tr
                  key={w.id}
                  onClick={() => openDetail(w)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-gray-900 first:pl-6">
                    {w.reportNumber}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{w.customerName}</div>
                    <div className="text-xs text-gray-400">{w.contactPerson}</div>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-gray-600">
                    {w.address}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={w.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                    {new Date(w.submittedAt).toLocaleDateString('da-DK', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 pr-6">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); openQControlReport(w) }}
                        title="Vis original rapport"
                        className="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      >
                        <FileText size={15} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); openDetail(w) }}
                        className="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
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
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div
            onClick={e => e.stopPropagation()}
            className="relative z-10 flex h-full w-full max-w-5xl flex-col bg-white shadow-2xl"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  {editMode ? 'Rediger rapport' : selected.reportNumber}
                </h2>
                <p className="text-xs text-gray-400">{selected.id}</p>
              </div>
              <div className="flex items-center gap-2">
                {!editMode && (
                  <button
                    onClick={() => setShowVersions(v => !v)}
                    className={`rounded-md p-1.5 transition-colors ${
                      showVersions ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                    title="Vis versioner"
                  >
                    <Clock size={16} />
                  </button>
                )}
                {editMode ? (
                  <>
                    <button
                      onClick={cancelEdit}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                    <button
                      onClick={saveEdit}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-800"
                    >
                      <Save size={14} />
                      Gem
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={startEdit}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
          onClick={() => { setSelected(null); setEditMode(false); setEditDraft(null) }}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <XCircle size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {editMode && editDraft ? (
                <EditContent
                  draft={editDraft}
                  onChange={updateDraft}
                  onToggleInstallation={toggleDraftInstallation}
                  onToggleClosure={toggleDraftClosure}
                  onToggleControlItem={toggleDraftControlItem}
                />
              ) : showVersions ? (
                <VersionPanel
                  entries={versionHistory[selected.id] ?? []}
                  workslip={selected}
                  onClose={() => setShowVersions(false)}
                />
              ) : (
                <WorkslipDetail workslip={selected} />
              )}
            </div>

            <div className="border-t border-gray-100 px-6 py-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openQControlReport(selected)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  <FileText size={16} />
                  Åbn PDF-rapport
                </button>
                <button
                  onClick={() => openWrittenReport(selected)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <FileText size={16} />
                  Hent skriftlig rapport
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import dialog */}
      {showImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => { if (!importing) setShowImport(false) }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Upload scannede rapporter</h2>
              {!importing && (
                <button onClick={() => setShowImport(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <X size={18} />
                </button>
              )}
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="mb-4 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 px-6 py-8 text-sm text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
            >
              <UploadCloud size={32} className="text-gray-300" />
              <span className="font-medium">Tryk for at vælge filer</span>
              <span className="text-xs">PDF, PNG, JPG — OCR og AI-gennemgang simuleres i demoen</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={e => { handleImportFiles(e.target.files); e.target.value = '' }}
            />

            {importFiles.length > 0 && (
              <div className="mb-4 max-h-40 space-y-1.5 overflow-y-auto">
                {importFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={14} className="shrink-0 text-gray-400" />
                      <span className="truncate text-gray-700">{f.name}</span>
                    </div>
                    {!importing && (
                      <button onClick={() => removeImportFile(i)} className="shrink-0 text-gray-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={runImport}
              disabled={importFiles.length === 0 || importing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing ? (
                <><Loader2 size={16} className="animate-spin" /> Sender til AI-gennemgang…</>
              ) : (
                <><Upload size={16} /> Send til AI-gennemgang {importFiles.length > 0 ? `(${importFiles.length})` : ''}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


// ─── Edit content ───────────────────────────────

function EditContent({
  draft,
  onChange,
  onToggleInstallation,
  onToggleClosure,
  onToggleControlItem,
}: {
  draft: Workslip
  onChange: (field: keyof Workslip, value: any) => void
  onToggleInstallation: (type: InstallationType) => void
  onToggleClosure: (flag: ClosureFlag) => void
  onToggleControlItem: (stageId: string, item: { id: string; label: string }) => void
}) {
  return (
    <div className="divide-y divide-gray-50">
      <Section icon={FileText} title="Rapportoplysninger">
        <EditField label="Kunde">
          <input value={draft.customerName} onChange={e => onChange('customerName', e.target.value)} className="input" />
        </EditField>
        <EditField label="Kontaktperson">
          <input value={draft.contactPerson} onChange={e => onChange('contactPerson', e.target.value)} className="input" />
        </EditField>
        <EditField label="Telefon">
          <input value={draft.phone} onChange={e => onChange('phone', e.target.value)} className="input" />
        </EditField>
        <EditField label="Adresse">
          <input value={draft.address} onChange={e => onChange('address', e.target.value)} className="input" />
        </EditField>
        <EditField label="Dato">
          <input type="date" value={draft.date} onChange={e => onChange('date', e.target.value)} className="input" />
        </EditField>
        <EditField label="Opgavebeskrivelse">
          <textarea value={draft.description} onChange={e => onChange('description', e.target.value)} className="input min-h-[60px]" rows={2} />
        </EditField>
        <EditField label="Oplysninger til kunden">
          <textarea value={draft.customerInfo} onChange={e => onChange('customerInfo', e.target.value)} className="input min-h-[60px]" rows={2} />
        </EditField>
      </Section>

      <Section icon={Wrench} title="Kategorier">
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-400">Anlægstype</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {instList.map(t => {
              const active = draft.installationTypes.includes(t)
              return (
                <button
                  key={t}
                  onClick={() => onToggleInstallation(t)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                    active ? instColors[t] : 'text-gray-500 bg-gray-50 ring-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {installationTypeLabels[t]}
                </button>
              )
            })}
          </div>
        </div>
        <EditField label="Arbejdstype">
          <select value={draft.workKind} onChange={e => onChange('workKind', e.target.value)} className="input">
            {workKindList.map(k => (
              <option key={k} value={k}>{workKindLabels[k]}</option>
            ))}
          </select>
        </EditField>
        {draft.workKind === 'serviceAndet' && (
          <EditField label="Anden opgavetype">
            <input value={draft.customWorkKind} onChange={e => onChange('customWorkKind', e.target.value)} className="input" />
          </EditField>
        )}
      </Section>

      <Section icon={ClipboardCheck} title="Kontrolpunkter">
        {draft.controlStages.length === 0 ? (
          <p className="text-sm text-gray-400">Ingen kontrolpunkter</p>
        ) : (
          <div className="space-y-1">
            {draft.controlStages.map(stage => {
              const stageDef = controlStageDefs.find(s => s.id === stage.stageId)
              const activeColumns = [...new Set(draft.installationTypes.map(i => installationToControlColumns[i]))]
              const stageItems: Array<{ id: string; label: string }> = []
              for (const col of activeColumns) {
                const colItems = stageDef?.items[col] ?? []
                for (const item of colItems) {
                  stageItems.push(item)
                }
              }
              const total = stageItems.length || stage.totalItems
              return (
                <StageCollapse
                  key={stage.stageId}
                  stageId={stage.stageId}
                  title={stage.stageTitle}
                  checked={stage.checkedItems.length}
                  total={total}
                >
                  {stageItems.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Ingen kontrolpunkter for valgte anlægstyper</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {stageItems.map(item => {
                        const checked = stage.checkedItems.some(c => c.id === item.id)
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onToggleControlItem(stage.stageId, item)}
                            className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors ${
                              checked
                                ? 'bg-gray-900 text-white hover:bg-gray-800'
                                : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <Check size={11} className={`shrink-0 ${checked ? 'text-white' : 'text-transparent'}`} />
                            <span className="truncate">{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </StageCollapse>
              )
            })}
          </div>
        )}
        <EditField label="Bemærkninger">
          <textarea value={draft.remarks} onChange={e => onChange('remarks', e.target.value)} className="input min-h-[60px]" rows={2} />
        </EditField>
      </Section>

      <Section icon={Flag} title="Afslutning">
        <div className="flex flex-wrap gap-1.5">
          {closureFlagList.map(flag => {
            const active = draft.closureFlags.includes(flag)
            const isConflicting = flag === 'ikkeFaerdig'
            return (
              <button
                key={flag}
                onClick={() => onToggleClosure(flag)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors ${
                  active
                    ? 'bg-gray-900 text-white ring-gray-900'
                    : 'bg-white text-gray-500 ring-gray-200 hover:bg-gray-50'
                }`}
              >
                {active && <Check size={11} />}
                {closureFlagLabels[flag]}
              </button>
            )
          })}
        </div>
      </Section>

    </div>
  )
}

// ─── Shared components ─────────────────────────

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={15} className="text-gray-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</span>
      </div>
      {children}
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
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

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-2.5 block">
      <span className="mb-1 block text-xs font-medium text-gray-400">{label}</span>
      {children}
    </label>
  )
}

function StageCollapse({ stageId, title, checked, total, children }: { stageId: string; title: string; checked: number; total: number; children: React.ReactNode }) {
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

function WorkslipDetail({ workslip }: { workslip: Workslip }) {
  const dateLabel = (d: string) => new Date(d).toLocaleDateString('da-DK', { day: '2-digit', month: 'long', year: 'numeric' })
  return (
    <div className="divide-y divide-gray-50">
      <Section icon={Clock} title="Status">
        <StatusBadge status={workslip.status} />
      </Section>

      <Section icon={FileText} title="Rapportoplysninger">
        <DetailRow icon={Building2} label="Kunde" value={workslip.customerName} />
        <DetailRow icon={User} label="Kontaktperson" value={workslip.contactPerson} />
        <DetailRow icon={Phone} label="Telefon" value={workslip.phone} />
        <DetailRow icon={MapPin} label="Adresse" value={workslip.address} />
        <DetailRow icon={CalendarDays} label="Dato" value={dateLabel(workslip.date)} />
        <div className="mt-3">
          <span className="text-xs font-medium text-gray-400">Opgavebeskrivelse</span>
          <p className="mt-0.5 text-sm text-gray-700">{workslip.description}</p>
        </div>
        {workslip.customerInfo && (
          <div className="mt-2">
            <span className="text-xs font-medium text-gray-400">Oplysninger til kunden</span>
            <p className="mt-0.5 text-sm text-gray-700">{workslip.customerInfo}</p>
          </div>
        )}
      </Section>

      <Section icon={Wrench} title="Arbejde">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {workslip.installationTypes.map(t => (
            <span key={t} className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${instColors[t]}`}>
              {installationTypeLabels[t]}
            </span>
          ))}
        </div>
        <DetailRow icon={ClipboardCheck} label="Type" value={workslip.workKind === 'serviceAndet' ? workslip.customWorkKind : workKindLabels[workslip.workKind]} />
      </Section>

      <Section icon={ClipboardCheck} title="Kontrolpunkter">
        {workslip.controlStages.length === 0 ? (
          <p className="text-sm text-gray-400">Ingen kontrolpunkter</p>
        ) : (
          <div className="space-y-1">
            {workslip.controlStages.map(stage => {
              const stageDef = controlStageDefs.find(s => s.id === stage.stageId)
              const activeColumns = [...new Set(workslip.installationTypes.map(i => installationToControlColumns[i]))]
              const stageItems: Array<{ id: string; label: string }> = []
              for (const col of activeColumns) {
                const colItems = stageDef?.items[col] ?? []
                for (const item of colItems) {
                  stageItems.push(item)
                }
              }
              return (
                <StageCollapse
                  key={stage.stageId}
                  stageId={stage.stageId}
                  title={stage.stageTitle}
                  checked={stage.checkedItems.length}
                  total={stageItems.length || stage.totalItems}
                >
                  {stageItems.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Ingen kontrolpunkter for valgte anlægstyper</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {stageItems.map(item => {
                        const checked = stage.checkedItems.some(c => c.id === item.id)
                        return (
                          <div key={item.id} className={`flex items-center gap-1.5 text-xs ${checked ? 'text-gray-700' : 'text-gray-400'}`}>
                            <Check size={11} className={`shrink-0 ${checked ? 'text-green-600' : 'text-gray-300'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </StageCollapse>
              )
            })}
          </div>
        )}
      </Section>

      {workslip.remarks && (
        <Section icon={Flag} title="Bemærkninger">
          <p className="text-sm text-gray-700">{workslip.remarks}</p>
        </Section>
      )}

      <Section icon={Flag} title="Afslutning">
        <div className="flex flex-wrap gap-1.5">
          {workslip.closureFlags.map(flag => (
            <span key={flag} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              <Check size={11} className="text-gray-500" />
              {closureFlagLabels[flag]}
            </span>
          ))}
        </div>
      </Section>
    </div>
  )
}

function VersionPanel({ entries, workslip, onClose }: { entries: VersionEntry[]; workslip: Workslip; onClose: () => void }) {
  const allVersions = [
    { version: 0, at: workslip.submittedAt, actor: 'System', changes: [{ field: 'Rapport oprettet', oldValue: '', newValue: '' }] },
    ...entries,
  ]
  return (
    <div className="divide-y divide-gray-50">
      <div className="px-6 pt-4">
        <button onClick={onClose} className="inline-flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-700">
          ← Tilbage til rapport
        </button>
      </div>
      <Section icon={Clock} title="Versioner">
        {allVersions.length === 1 ? (
          <p className="text-sm text-gray-400">Ingen ændringer endnu</p>
        ) : (
          <div className="space-y-4">
            {[...allVersions].reverse().map(v => (
              <div key={v.version} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900">Version {v.version}</span>
                  <span className="text-xs text-gray-400">{new Date(v.at).toLocaleString('da-DK')}</span>
                </div>
                <p className="mb-2 text-xs text-gray-500">{v.actor}</p>
                {v.changes.length > 0 && (
                  <div className="space-y-1">
                    {v.changes.map((c, i) => (
                      <div key={i} className="rounded bg-white px-2 py-1 text-xs">
                        <span className="font-medium text-gray-700">{c.field}: </span>
                        {c.oldValue ? (
                          <>
                            <span className="text-red-500 line-through">{c.oldValue}</span>
                            {' → '}
                            <span className="text-green-600">{c.newValue}</span>
                          </>
                        ) : (
                          <span className="text-green-600">{c.newValue}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
