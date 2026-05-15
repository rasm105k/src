'use client'

import { useMemo, useState, useRef, useCallback } from 'react'
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
  Plus,
} from 'lucide-react'
import {
  generateMockWorkslips,
  generateSingleWorkslip,
  installationTypeLabels,
  workKindLabels,
  closureFlagLabels,
  controlStageDefs,
  installationToControlColumns,
} from '@/lib/mock-data'
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

type SortKey = 'reportNumber' | 'customerName' | 'address' | 'workKind' | 'status' | 'technicianName' | 'submittedAt'
type SortDir = 'asc' | 'desc'

const instList: InstallationType[] = ['gas', 'vand', 'aflob', 'varme']
const workKindList: WorkKind[] = ['nyInstallation', 'aendring', 'reparation', 'serviceAndet']
const closureFlagList: ClosureFlag[] = ['ikkeFaerdig', 'faerdig', 'tegninger', 'faerdigmelding', 'driftVedligehold', 'klarTilFaktura']

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

export default function BackofficePage() {
  const [workslips, setWorkslips] = useState(() => generateMockWorkslips(150))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<WorkslipStatus | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('submittedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selected, setSelected] = useState<Workslip | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editDraft, setEditDraft] = useState<Workslip | null>(null)
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
          w.technicianName.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const aVal = String(a[sortKey] ?? '')
        const bVal = String(b[sortKey] ?? '')
        const cmp = aVal.localeCompare(bVal)
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
    if (!editDraft) return
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
    const newWorkslips = importFiles.map(f => generateSingleWorkslip(f.name))
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
        <button
          onClick={() => setShowImport(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          <Upload size={16} />
          Importér dokumenter
        </button>
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
                  { key: 'workKind', label: 'Type' },
                  { key: 'status', label: 'Status' },
                  { key: 'technicianName', label: 'Montør' },
                  { key: 'submittedAt', label: 'Indsendt' },
                ] as { key: SortKey; label: string }[]).map(col => (
                  <th
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
                    <div className="flex flex-wrap gap-1">
                      {w.installationTypes.map(t => (
                        <span
                          key={t}
                          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${instColors[t]}`}
                        >
                          {installationTypeLabels[t]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={w.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {w.technicianName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                    {new Date(w.submittedAt).toLocaleDateString('da-DK', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 pr-6">
                    <button
                      onClick={e => { e.stopPropagation(); openDetail(w) }}
                      className="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600"
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
          onClick={() => { if (!editMode) setSelected(null) }}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div
            onClick={e => e.stopPropagation()}
            className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
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
                      onClick={() => setSelected(null)}
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
              ) : (
                <ViewContent selected={selected} />
              )}
            </div>

            <div className="border-t border-gray-100 px-6 py-4">
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800">
                <FileText size={16} />
                Åbn PDF-rapport
              </button>
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
              <h2 className="text-lg font-semibold tracking-tight">Importér dokumenter</h2>
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
              <span className="text-xs">PDF, PNG, JPG — op til 50 MB</span>
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
                <><Loader2 size={16} className="animate-spin" /> Importerer…</>
              ) : (
                <><Upload size={16} /> Importér {importFiles.length > 0 ? `(${importFiles.length} filer)` : ''}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── View content ───────────────────────────────

function ViewContent({ selected }: { selected: Workslip }) {
  return (
    <div className="divide-y divide-gray-50">
      <Section icon={Clock} title="Status">
        <div className="flex items-center gap-2">
          <StatusBadge status={selected.status} />
          {selected.status === 'completed' && <span className="text-xs text-green-600">Godkendt</span>}
          {selected.status === 'failed' && <span className="text-xs text-red-600">Afvist</span>}
        </div>
      </Section>

      <Section icon={FileText} title="Rapportoplysninger">
        <DetailRow icon={Building2} label="Kunde" value={selected.customerName} />
        <DetailRow icon={User} label="Kontaktperson" value={selected.contactPerson} />
        <DetailRow icon={Phone} label="Telefon" value={selected.phone} />
        <DetailRow icon={MapPin} label="Adresse" value={selected.address} />
        <DetailRow icon={CalendarDays} label="Dato" value={new Date(selected.date).toLocaleDateString('da-DK', { day: '2-digit', month: 'long', year: 'numeric' })} />
        <div className="mt-3">
          <span className="text-xs font-medium text-gray-400">Opgavebeskrivelse</span>
          <p className="mt-0.5 text-sm text-gray-700">{selected.description}</p>
        </div>
        {selected.customerInfo && (
          <div className="mt-2">
            <span className="text-xs font-medium text-gray-400">Oplysninger til kunden</span>
            <p className="mt-0.5 text-sm text-gray-700">{selected.customerInfo}</p>
          </div>
        )}
      </Section>

      <Section icon={Wrench} title="Kategorier">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {selected.installationTypes.map(t => (
            <span key={t} className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${instColors[t]}`}>
              {installationTypeLabels[t]}
            </span>
          ))}
        </div>
        <DetailRow icon={Wrench} label="Arbejdstype" value={selected.workKind === 'serviceAndet' ? selected.customWorkKind : workKindLabels[selected.workKind]} />
      </Section>

      <Section icon={ClipboardCheck} title="Kontrolpunkter">
        {selected.controlStages.length === 0 ? (
          <p className="text-sm text-gray-400">Ingen kontrolpunkter</p>
        ) : (
          <div className="space-y-4">
            {selected.controlStages.map(stage => (
              <div key={stage.stageId}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{stage.stageTitle}</span>
                  <span className="text-xs text-gray-400">{stage.checkedItems.length}/{stage.totalItems}</span>
                </div>
                {stage.checkedItems.length > 0 ? (
                  <div className="space-y-0.5">
                    {stage.checkedItems.map(item => (
                      <div key={item.id} className="flex items-start gap-2 rounded-md bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                        <Check size={12} className="mt-0.5 shrink-0 text-green-600" />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Ingen markeret</p>
                )}
              </div>
            ))}
          </div>
        )}
        {selected.remarks && (
          <div className="mt-4">
            <span className="text-xs font-medium text-gray-400">Bemærkninger</span>
            <p className="mt-0.5 text-sm text-gray-700">{selected.remarks}</p>
          </div>
        )}
      </Section>

      <Section icon={Flag} title="Afslutning">
        <div className="flex flex-wrap gap-1.5">
          {selected.closureFlags.map(flag => (
            <span key={flag} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              <Check size={11} className="text-gray-500" />
              {closureFlagLabels[flag]}
            </span>
          ))}
        </div>
      </Section>

      <Section icon={FileSignature} title="Underskrift">
        <DetailRow icon={User} label="Montør" value={selected.technicianName} />
        <DetailRow icon={CalendarDays} label="Dato" value={new Date(selected.signatureDate).toLocaleDateString('da-DK', { day: '2-digit', month: 'long', year: 'numeric' })} />
      </Section>

      <Section icon={Clock} title="Tidslinje">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <div>
              <span className="text-gray-500">Indsendt: </span>
              <span className="text-gray-700">
                {new Date(selected.submittedAt).toLocaleDateString('da-DK', {
                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          {selected.processedAt && (
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${selected.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <span className="text-gray-500">Behandlet: </span>
                <span className="text-gray-700">
                  {new Date(selected.processedAt).toLocaleDateString('da-DK', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </Section>
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

          return (
            <div key={stage.stageId} className="mb-3">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{stage.stageTitle}</span>
                <span className="text-xs text-gray-400">{stage.checkedItems.length}/{stage.totalItems}</span>
              </div>
              <div className="space-y-0.5">
                {stageItems.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Ingen kontrolpunkter for valgte anlægstyper</p>
                ) : stageItems.map(item => {
                  const checked = stage.checkedItems.some(c => c.id === item.id)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onToggleControlItem(stage.stageId, item)}
                      className={`flex w-full items-start gap-2 rounded-md px-3 py-1.5 text-xs transition-colors ${
                        checked
                          ? 'bg-gray-900 text-white hover:bg-gray-800'
                          : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                        checked ? 'bg-white/20' : 'bg-gray-100'
                      }`}>
                        {checked && <Check size={11} className="text-white" />}
                      </div>
                      <span className="text-left">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
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

      <Section icon={FileSignature} title="Underskrift">
        <EditField label="Montør">
          <input value={draft.technicianName} onChange={e => onChange('technicianName', e.target.value)} className="input" />
        </EditField>
        <EditField label="Dato">
          <input type="date" value={draft.signatureDate} onChange={e => onChange('signatureDate', e.target.value)} className="input" />
        </EditField>
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
