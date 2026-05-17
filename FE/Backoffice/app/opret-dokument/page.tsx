'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Building2, CalendarDays, Wrench, Flag, FileSignature, Check, Loader2, Phone, ShieldCheck, Plus, X } from 'lucide-react'
import { openQControlReport } from '@/lib/q-control-report'
import { generateSingleWorkslip, installationTypeLabels, workKindLabels, closureFlagLabels } from '@/lib/mock-data'
import type { Workslip, InstallationType, WorkKind, ClosureFlag } from '@/lib/types'

const DOCUMENT_TYPES = [
  { id: 'qcontrol', label: 'Q-kontrol rapport', description: 'Formel Q-kontrol rapport med kontrolpunkter, signatur og tidslinje' },
  { id: 'driftVedligehold', label: 'Drift- og vedligeholdelsesdokumentation', description: 'Drift- og vedligeholdelsesmappe med virksomhedsoplysninger, leverandørkontakter og vedligeholdelsesplan' },
] as const

type DocTypeId = (typeof DOCUMENT_TYPES)[number]['id']

const instList: InstallationType[] = ['gas', 'vand', 'aflob', 'varme']
const workKindList: WorkKind[] = ['nyInstallation', 'aendring', 'reparation', 'serviceAndet']
const closureFlagList: ClosureFlag[] = ['ikkeFaerdig', 'faerdig', 'tegninger', 'faerdigmelding', 'driftVedligehold', 'klarTilFaktura']

const INST_COLORS: Record<InstallationType, string> = {
  gas: 'text-orange-700 bg-orange-50 ring-orange-600/20',
  vand: 'text-cyan-700 bg-cyan-50 ring-cyan-600/20',
  aflob: 'text-stone-700 bg-stone-50 ring-stone-600/20',
  varme: 'text-rose-700 bg-rose-50 ring-rose-600/20',
}

const DEFAULT_SUPPLIERS = [
  { name: 'Sanistål', phone: '87 22 70 00' },
  { name: 'Herning Vand', phone: '99992299' },
  { name: 'Wavin', phone: '86 96 20 00' },
]

const DEFAULT_MAINTENANCE_PLAN = [
  { component: 'Vandmåler', interval: 'ugentlig/årlig' },
  { component: 'Varmtvandstemperatur', interval: 'ugentlig' },
  { component: 'Sikkerhedsventiler', interval: 'hver 6. måned' },
]

interface SupplierContact {
  name: string
  phone: string
}

interface MaintenanceItem {
  component: string
  interval: string
}

function escHtml(v: unknown): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function openDriftVedligeholdReport(data: {
  companyName: string
  companyCvr: string
  companyAddress: string
  suppliers: SupplierContact[]
  maintenancePlan: MaintenanceItem[]
  instructionsSummary: string
}): void {
  const popup = window.open('', '_blank', 'width=1100,height=900')
  if (!popup) return
  const now = new Date().toLocaleString('da-DK')
  const suppliersRows = data.suppliers.length > 0
    ? data.suppliers.map(s => `<tr><td>${escHtml(s.name)}</td><td>${escHtml(s.phone)}</td></tr>`).join('')
    : '<tr><td colspan="2" class="muted">Ingen leverandører registreret</td></tr>'
  const planRows = data.maintenancePlan.length > 0
    ? data.maintenancePlan.map(m => `<tr><td>${escHtml(m.component)}</td><td>${escHtml(m.interval)}</td></tr>`).join('')
    : '<tr><td colspan="2" class="muted">Ingen vedligeholdelsespunkter registreret</td></tr>'

  popup.document.open()
  popup.document.write(`<!doctype html>
<html lang="da">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Drift- og vedligeholdelsesdokumentation</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f3f4f6; color: #111827; font-family: Arial, Helvetica, sans-serif; line-height: 1.45; }
    .page { width: 210mm; min-height: 297mm; margin: 18px auto; background: white; padding: 18mm; box-shadow: 0 18px 50px rgba(15,23,42,0.16); }
    header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #111827; padding-bottom: 18px; margin-bottom: 20px; }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 25px; letter-spacing: 0; }
    h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #374151; margin-bottom: 10px; }
    h3 { font-size: 14px; }
    .meta { text-align: right; font-size: 12px; color: #4b5563; }
    .section { break-inside: avoid; border-top: 1px solid #e5e7eb; padding-top: 14px; margin-top: 16px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px 18px; }
    .field dt { color: #6b7280; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; }
    .field dd { margin: 2px 0 0; font-size: 13px; color: #111827; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 10px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: #6b7280; }
    td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
    .note { min-height: 42px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; font-size: 13px; background: #fcfcfd; white-space: pre-wrap; }
    .muted { color: #6b7280; font-style: italic; }
    .actions { position: sticky; top: 0; display: flex; justify-content: center; gap: 8px; background: rgba(243,244,246,0.9); backdrop-filter: blur(8px); padding: 12px; }
    .actions button { border: 0; border-radius: 8px; background: #111827; color: white; cursor: pointer; font-weight: 700; padding: 10px 14px; }
    @page { size: A4; margin: 12mm; }
    @media print { body { background: white; } .actions { display: none; } .page { width: auto; min-height: auto; margin: 0; padding: 0; box-shadow: none; } }
  </style>
</head>
<body>
  <div class="actions">
    <button onclick="window.print()">Gem som PDF / print</button>
  </div>
  <main class="page">
    <header>
      <div>
        <h1>Drift- og vedligeholdelsesdokumentation</h1>
        <p class="muted">Virksomhedens kontrol- og vedligeholdelsesplan</p>
      </div>
      <div class="meta">
        Genereret: ${escHtml(now)}
      </div>
    </header>

    <section class="section">
      <h2>Virksomhedsoplysninger</h2>
      <dl class="grid">
        <div class="field">
          <dt>Virksomhed</dt>
          <dd>${escHtml(data.companyName)}</dd>
        </div>
        <div class="field">
          <dt>CVR</dt>
          <dd>${escHtml(data.companyCvr || 'Ikke registreret')}</dd>
        </div>
        <div class="field">
          <dt>Adresse</dt>
          <dd>${escHtml(data.companyAddress || 'Ikke registreret')}</dd>
        </div>
      </dl>
    </section>

    <section class="section">
      <h2>Leverandørkontakter</h2>
      <table>
        <thead>
          <tr><th>Leverandør</th><th>Telefon</th></tr>
        </thead>
        <tbody>${suppliersRows}</tbody>
      </table>
    </section>

    <section class="section">
      <h2>Kontrol- og vedligeholdelsesplan</h2>
      <table>
        <thead>
          <tr><th>Komponent</th><th>Interval</th></tr>
        </thead>
        <tbody>${planRows}</tbody>
      </table>
    </section>

    <section class="section">
      <h2>Vejledningsoversigt</h2>
      <div class="note">${escHtml(data.instructionsSummary || 'Ingen vejledninger registreret.')}</div>
    </section>

    <section class="section" style="border-top: 2px solid #111827; margin-top: 32px; padding-top: 18px;">
      <p style="font-size: 11px; color: #6b7280; text-align: center;">
        Dokumentet er genereret fra Workslip Backoffice &mdash; ${escHtml(now)}
      </p>
    </section>
  </main>
</body>
</html>`)
  popup.document.close()
  popup.focus()
}

export default function CreateDocumentPage() {
  const [docType, setDocType] = useState<DocTypeId>('qcontrol')
  const [generating, setGenerating] = useState(false)

  const isDriftVedligehold = docType === 'driftVedligehold'

  const [customerName, setCustomerName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [customerInfo, setCustomerInfo] = useState('')
  const [installationTypes, setInstallationTypes] = useState<InstallationType[]>(['gas'])
  const [workKind, setWorkKind] = useState<WorkKind>('nyInstallation')
  const [customWorkKind, setCustomWorkKind] = useState('')
  const [remarks, setRemarks] = useState('')
  const [closureFlags, setClosureFlags] = useState<ClosureFlag[]>(['faerdig'])
  const [technicianName, setTechnicianName] = useState('')
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0])

  const [dvCompanyName, setDvCompanyName] = useState('N.P VVS Teknik ApS')
  const [dvCompanyCvr, setDvCompanyCvr] = useState('37236497')
  const [dvCompanyAddress, setDvCompanyAddress] = useState('Bødkervej 10, 7480 Vildbjerg')
  const [dvSuppliers, setDvSuppliers] = useState<SupplierContact[]>(DEFAULT_SUPPLIERS)
  const [dvMaintenancePlan, setDvMaintenancePlan] = useState<MaintenanceItem[]>(DEFAULT_MAINTENANCE_PLAN)
  const [dvInstructionsSummary, setDvInstructionsSummary] = useState('')

  function toggleInstallation(type: InstallationType) {
    setInstallationTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  function toggleClosure(flag: ClosureFlag) {
    setClosureFlags(prev => {
      if (flag === 'ikkeFaerdig') {
        return prev.includes('ikkeFaerdig') ? [] : ['ikkeFaerdig']
      }
      const without = prev.filter(f => f !== 'ikkeFaerdig')
      return without.includes(flag) ? without.filter(f => f !== flag) : [...without, flag]
    })
  }

  function addSupplier() {
    setDvSuppliers(prev => [...prev, { name: '', phone: '' }])
  }

  function updateSupplier(index: number, field: 'name' | 'phone', value: string) {
    setDvSuppliers(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  function removeSupplier(index: number) {
    setDvSuppliers(prev => prev.filter((_, i) => i !== index))
  }

  function addMaintenanceItem() {
    setDvMaintenancePlan(prev => [...prev, { component: '', interval: '' }])
  }

  function updateMaintenanceItem(index: number, field: 'component' | 'interval', value: string) {
    setDvMaintenancePlan(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  function removeMaintenanceItem(index: number) {
    setDvMaintenancePlan(prev => prev.filter((_, i) => i !== index))
  }

  function handleGenerate() {
    setGenerating(true)
    if (isDriftVedligehold) {
      setTimeout(() => {
        setGenerating(false)
        openDriftVedligeholdReport({
          companyName: dvCompanyName,
          companyCvr: dvCompanyCvr,
          companyAddress: dvCompanyAddress,
          suppliers: dvSuppliers,
          maintenancePlan: dvMaintenancePlan,
          instructionsSummary: dvInstructionsSummary,
        })
      }, 300)
    } else {
      const base = generateSingleWorkslip('Oprettet manuelt')
      const workslip: Workslip = {
        ...base,
        customerName: customerName || base.customerName,
        contactPerson: contactPerson || base.contactPerson,
        phone: phone || base.phone,
        address: address || base.address,
        date: date || base.date,
        description: description || base.description,
        customerInfo: customerInfo || base.customerInfo,
        installationTypes: installationTypes.length > 0 ? installationTypes : base.installationTypes,
        workKind,
        customWorkKind: workKind === 'serviceAndet' ? (customWorkKind || 'Serviceeftersyn') : '',
        remarks: remarks || base.remarks,
        closureFlags: closureFlags.length > 0 ? closureFlags : base.closureFlags,
        technicianName: technicianName || base.technicianName,
        signatureDate: signatureDate || base.signatureDate,
      }
      setTimeout(() => {
        setGenerating(false)
        openQControlReport(workslip)
      }, 300)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700">
          <ArrowLeft size={14} />
          Tilbage til oversigt
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Opret dokument</h1>
        <p className="mt-1 text-sm text-gray-500">Vælg dokumenttype og udfyld oplysningerne for at generere et dokument.</p>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">Dokumenttype</span>
          <select
            value={docType}
            onChange={e => setDocType(e.target.value as DocTypeId)}
            className="input"
          >
            {DOCUMENT_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-gray-400">
            {DOCUMENT_TYPES.find(t => t.id === docType)?.description}
          </p>
        </label>
      </div>

      {isDriftVedligehold ? (
        <div className="space-y-6">
          <Section icon={Building2} title="Virksomhedsoplysninger">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Virksomhed">
                <input value={dvCompanyName} onChange={e => setDvCompanyName(e.target.value)} className="input" placeholder="F.eks. N.P VVS Teknik ApS" />
              </Field>
              <Field label="CVR">
                <input value={dvCompanyCvr} onChange={e => setDvCompanyCvr(e.target.value)} className="input" placeholder="F.eks. 37236497" />
              </Field>
              <Field label="Adresse" fullWidth>
                <input value={dvCompanyAddress} onChange={e => setDvCompanyAddress(e.target.value)} className="input" placeholder="F.eks. Bødkervej 10, 7480 Vildbjerg" />
              </Field>
            </div>
          </Section>

          <Section icon={Phone} title="Leverandørkontakter">
            <div className="space-y-2">
              {dvSuppliers.map((supplier, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <input
                      value={supplier.name}
                      onChange={e => updateSupplier(i, 'name', e.target.value)}
                      className="input"
                      placeholder="Leverandørnavn"
                    />
                    <input
                      value={supplier.phone}
                      onChange={e => updateSupplier(i, 'phone', e.target.value)}
                      className="input"
                      placeholder="Telefon"
                    />
                  </div>
                  <button
                    onClick={() => removeSupplier(i)}
                    className="mt-0.5 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={addSupplier}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
              >
                <Plus size={14} />
                Tilføj leverandør
              </button>
            </div>
          </Section>

          <Section icon={ShieldCheck} title="Kontrol- og vedligeholdelsesplan">
            <div className="space-y-2">
              {dvMaintenancePlan.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <input
                      value={item.component}
                      onChange={e => updateMaintenanceItem(i, 'component', e.target.value)}
                      className="input"
                      placeholder="Komponent"
                    />
                    <input
                      value={item.interval}
                      onChange={e => updateMaintenanceItem(i, 'interval', e.target.value)}
                      className="input"
                      placeholder="Interval"
                    />
                  </div>
                  <button
                    onClick={() => removeMaintenanceItem(i)}
                    className="mt-0.5 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={addMaintenanceItem}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
              >
                <Plus size={14} />
                Tilføj vedligeholdelsespunkt
              </button>
            </div>
          </Section>

          <Section icon={FileText} title="Vejledningsoversigt">
            <Field label="Vejledninger">
              <textarea value={dvInstructionsSummary} onChange={e => setDvInstructionsSummary(e.target.value)} className="input min-h-[80px]" rows={3} placeholder="Eventuelle vejledninger eller bemærkninger..." />
            </Field>
          </Section>
        </div>
      ) : (
        <div className="space-y-6">
          <Section icon={Building2} title="Kunde og adresse">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Kundenavn">
                <input value={customerName} onChange={e => setCustomerName(e.target.value)} className="input" placeholder="F.eks. Aarhus Ejendomme ApS" />
              </Field>
              <Field label="Kontaktperson">
                <input value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="input" placeholder="F.eks. Mette Jensen" />
              </Field>
              <Field label="Telefon">
                <input value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="F.eks. 26 75 09 81" />
              </Field>
              <Field label="Adresse">
                <input value={address} onChange={e => setAddress(e.target.value)} className="input" placeholder="F.eks. Trøjborgvej 12, 8200 Aarhus N" />
              </Field>
            </div>
          </Section>

          <Section icon={CalendarDays} title="Arbejdet">
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Dato">
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
                </Field>
                <Field label="Montør">
                  <input value={technicianName} onChange={e => setTechnicianName(e.target.value)} className="input" placeholder="F.eks. Rasmus Bak" />
                </Field>
              </div>
              <Field label="Opgavebeskrivelse">
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="input min-h-[60px]" rows={2} placeholder="Beskriv arbejdet der er udført..." />
              </Field>
              <Field label="Oplysninger til kunden">
                <textarea value={customerInfo} onChange={e => setCustomerInfo(e.target.value)} className="input min-h-[60px]" rows={2} placeholder="Eventuelle oplysninger til kunden..." />
              </Field>
            </div>
          </Section>

          <Section icon={Wrench} title="Kategorier">
            <div className="space-y-3">
              <div>
                <span className="mb-1.5 block text-xs font-medium text-gray-400">Anlægstype</span>
                <div className="flex flex-wrap gap-1.5">
                  {instList.map(t => {
                    const active = installationTypes.includes(t)
                    return (
                      <button
                        key={t}
                        onClick={() => toggleInstallation(t)}
                        className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                          active ? INST_COLORS[t] : 'text-gray-500 bg-gray-50 ring-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {installationTypeLabels[t]}
                      </button>
                    )
                  })}
                </div>
              </div>
              <Field label="Arbejdstype">
                <select value={workKind} onChange={e => setWorkKind(e.target.value as WorkKind)} className="input">
                  {workKindList.map(k => (
                    <option key={k} value={k}>{workKindLabels[k]}</option>
                  ))}
                </select>
              </Field>
              {workKind === 'serviceAndet' && (
                <Field label="Anden opgavetype">
                  <input value={customWorkKind} onChange={e => setCustomWorkKind(e.target.value)} className="input" placeholder="Beskriv opgavetypen..." />
                </Field>
              )}
            </div>
          </Section>

          <Section icon={Flag} title="Afslutning">
            <div className="space-y-3">
              <Field label="Bemærkninger">
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="input min-h-[60px]" rows={2} placeholder="Eventuelle bemærkninger..." />
              </Field>
              <div>
                <span className="mb-1.5 block text-xs font-medium text-gray-400">Afslutningsflag</span>
                <div className="flex flex-wrap gap-1.5">
                  {closureFlagList.map(flag => {
                    const active = closureFlags.includes(flag)
                    return (
                      <button
                        key={flag}
                        onClick={() => toggleClosure(flag)}
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
              </div>
            </div>
          </Section>

          <Section icon={FileSignature} title="Underskrift">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Montør">
                <input value={technicianName} onChange={e => setTechnicianName(e.target.value)} className="input" placeholder="F.eks. Rasmus Bak" />
              </Field>
              <Field label="Underskriftsdato">
                <input type="date" value={signatureDate} onChange={e => setSignatureDate(e.target.value)} className="input" />
              </Field>
            </div>
          </Section>
        </div>
      )}

      <div className="mt-8 flex items-center gap-3 border-t border-gray-200 pt-6">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? (
            <><Loader2 size={16} className="animate-spin" /> Genererer…</>
          ) : (
            <><FileText size={16} /> Generer {DOCUMENT_TYPES.find(t => t.id === docType)?.label}</>
          )}
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Annuller
        </Link>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={15} className="text-gray-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</span>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children, fullWidth }: { label: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <label className={`block ${fullWidth ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-xs font-medium text-gray-400">{label}</span>
      {children}
    </label>
  )
}
