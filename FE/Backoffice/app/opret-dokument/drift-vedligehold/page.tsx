'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Building2, Phone, ShieldCheck, Plus, X, Loader2 } from 'lucide-react'
import { Section, Field, escHtml } from '../shared'

interface SupplierContact {
  name: string
  phone: string
}

interface MaintenanceItem {
  component: string
  interval: string
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
    h1 { font-size: 25px; }
    h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #374151; margin-bottom: 10px; }
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
      <div class="meta">Genereret: ${escHtml(now)}</div>
    </header>
    <section class="section">
      <h2>Virksomhedsoplysninger</h2>
      <dl class="grid">
        <div class="field"><dt>Virksomhed</dt><dd>${escHtml(data.companyName)}</dd></div>
        <div class="field"><dt>CVR</dt><dd>${escHtml(data.companyCvr || 'Ikke registreret')}</dd></div>
        <div class="field"><dt>Adresse</dt><dd>${escHtml(data.companyAddress || 'Ikke registreret')}</dd></div>
      </dl>
    </section>
    <section class="section">
      <h2>Leverandørkontakter</h2>
      <table><thead><tr><th>Leverandør</th><th>Telefon</th></tr></thead><tbody>${suppliersRows}</tbody></table>
    </section>
    <section class="section">
      <h2>Kontrol- og vedligeholdelsesplan</h2>
      <table><thead><tr><th>Komponent</th><th>Interval</th></tr></thead><tbody>${planRows}</tbody></table>
    </section>
    <section class="section">
      <h2>Vejledningsoversigt</h2>
      <div class="note">${escHtml(data.instructionsSummary || 'Ingen vejledninger registreret.')}</div>
    </section>
    <section class="section" style="border-top: 2px solid #111827; margin-top: 32px; padding-top: 18px;">
      <p style="font-size: 11px; color: #6b7280; text-align: center;">Dokumentet er genereret fra Workslip Backoffice &mdash; ${escHtml(now)}</p>
    </section>
  </main>
</body>
</html>`)
  popup.document.close()
  popup.focus()
}

export default function DriftVedligeholdPage() {
  const [companyName, setCompanyName] = useState('N.P VVS Teknik ApS')
  const [companyCvr, setCompanyCvr] = useState('37236497')
  const [companyAddress, setCompanyAddress] = useState('Bødkervej 10, 7480 Vildbjerg')
  const [suppliers, setSuppliers] = useState<SupplierContact[]>(DEFAULT_SUPPLIERS)
  const [maintenancePlan, setMaintenancePlan] = useState<MaintenanceItem[]>(DEFAULT_MAINTENANCE_PLAN)
  const [instructionsSummary, setInstructionsSummary] = useState('')
  const [generating, setGenerating] = useState(false)

  function addSupplier() {
    setSuppliers(prev => [...prev, { name: '', phone: '' }])
  }

  function updateSupplier(index: number, field: 'name' | 'phone', value: string) {
    setSuppliers(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  function removeSupplier(index: number) {
    setSuppliers(prev => prev.filter((_, i) => i !== index))
  }

  function addMaintenanceItem() {
    setMaintenancePlan(prev => [...prev, { component: '', interval: '' }])
  }

  function updateMaintenanceItem(index: number, field: 'component' | 'interval', value: string) {
    setMaintenancePlan(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  function removeMaintenanceItem(index: number) {
    setMaintenancePlan(prev => prev.filter((_, i) => i !== index))
  }

  function handleGenerate() {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      openDriftVedligeholdReport({
        companyName,
        companyCvr,
        companyAddress,
        suppliers,
        maintenancePlan,
        instructionsSummary,
      })
    }, 300)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/opret-dokument" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700">
          <ArrowLeft size={14} />
          Tilbage til dokumenttyper
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Drift- og vedligeholdelsesdokumentation</h1>
        <p className="mt-1 text-sm text-gray-500">Udfyld oplysningerne for at generere en drift- og vedligeholdelsesmappe.</p>
      </div>

      <div className="space-y-6">
        <Section icon={Building2} title="Virksomhedsoplysninger">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Virksomhed">
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="input" placeholder="F.eks. N.P VVS Teknik ApS" />
            </Field>
            <Field label="CVR">
              <input value={companyCvr} onChange={e => setCompanyCvr(e.target.value)} className="input" placeholder="F.eks. 37236497" />
            </Field>
            <Field label="Adresse" fullWidth>
              <input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className="input" placeholder="F.eks. Bødkervej 10, 7480 Vildbjerg" />
            </Field>
          </div>
        </Section>

        <Section icon={Phone} title="Leverandørkontakter">
          <div className="space-y-2">
            {suppliers.map((supplier, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  <input value={supplier.name} onChange={e => updateSupplier(i, 'name', e.target.value)} className="input" placeholder="Leverandørnavn" />
                  <input value={supplier.phone} onChange={e => updateSupplier(i, 'phone', e.target.value)} className="input" placeholder="Telefon" />
                </div>
                <button onClick={() => removeSupplier(i)} className="mt-0.5 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"><X size={16} /></button>
              </div>
            ))}
            <button onClick={addSupplier} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"><Plus size={14} /> Tilføj leverandør</button>
          </div>
        </Section>

        <Section icon={ShieldCheck} title="Kontrol- og vedligeholdelsesplan">
          <div className="space-y-2">
            {maintenancePlan.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  <input value={item.component} onChange={e => updateMaintenanceItem(i, 'component', e.target.value)} className="input" placeholder="Komponent" />
                  <input value={item.interval} onChange={e => updateMaintenanceItem(i, 'interval', e.target.value)} className="input" placeholder="Interval" />
                </div>
                <button onClick={() => removeMaintenanceItem(i)} className="mt-0.5 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"><X size={16} /></button>
              </div>
            ))}
            <button onClick={addMaintenanceItem} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"><Plus size={14} /> Tilføj vedligeholdelsespunkt</button>
          </div>
        </Section>

        <Section icon={FileText} title="Vejledningsoversigt">
          <Field label="Vejledninger">
            <textarea value={instructionsSummary} onChange={e => setInstructionsSummary(e.target.value)} className="input min-h-[80px]" rows={3} placeholder="Eventuelle vejledninger eller bemærkninger..." />
          </Field>
        </Section>
      </div>

      <div className="mt-8 flex items-center gap-3 border-t border-gray-200 pt-6">
        <button onClick={handleGenerate} disabled={generating} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
          {generating ? <><Loader2 size={16} className="animate-spin" /> Genererer…</> : <><FileText size={16} /> Generer Drift- og vedligeholdelsesdokumentation</>}
        </button>
        <Link href="/opret-dokument" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Annuller</Link>
      </div>
    </div>
  )
}
