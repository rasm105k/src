'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Wrench, Flag, Plus, X, Loader2 } from 'lucide-react'
import { Section, Field, escHtml } from '../shared'

interface CircuitRow {
  circuit: number
  room: string
  length: string
  preSetting: string
  channel: string
}

const DEFAULT_CIRCUITS = [
  { circuit: 1, room: 'Bryggers', length: '', preSetting: '', channel: '' },
  { circuit: 2, room: '', length: '', preSetting: '', channel: '' },
]

function openIndreguleringReport(data: {
  supplierName: string
  customerName: string
  roomName: string
  pumpType: string
  circuits: CircuitRow[]
  flowTemperature: string
  remarks: string
  performedBy: string
  performedDate: string
}): void {
  const popup = window.open('', '_blank', 'width=1100,height=900')
  if (!popup) return
  const now = new Date().toLocaleString('da-DK')
  const circuitRows = data.circuits.length > 0
    ? data.circuits.map(c =>
        `<tr><td>${escHtml(String(c.circuit))}</td><td>${escHtml(c.room || '-')}</td><td>${escHtml(c.length || '-')}</td><td>${escHtml(c.preSetting || '-')}</td><td>${escHtml(c.channel || '-')}</td></tr>`
      ).join('')
    : '<tr><td colspan="5" class="muted">Ingen kredse registreret</td></tr>'

  popup.document.open()
  popup.document.write(`<!doctype html>
<html lang="da">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Gulvvarme indregulering</title>
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
  <div class="actions"><button onclick="window.print()">Gem som PDF / print</button></div>
  <main class="page">
    <header>
      <div><h1>Gulvvarme indregulering</h1><p class="muted">Indreguleringsskema for gulvvarmeanlæg</p></div>
      <div class="meta">Genereret: ${escHtml(now)}</div>
    </header>
    <section class="section">
      <h2>Projektoplysninger</h2>
      <dl class="grid">
        <div class="field"><dt>Leverandør/system</dt><dd>${escHtml(data.supplierName || 'Ikke registreret')}</dd></div>
        <div class="field"><dt>Kunde/projekt</dt><dd>${escHtml(data.customerName)}</dd></div>
        <div class="field"><dt>Rum/område</dt><dd>${escHtml(data.roomName)}</dd></div>
        <div class="field"><dt>Udførende</dt><dd>${escHtml(data.performedBy || 'Ikke registreret')}</dd></div>
        <div class="field"><dt>Dato</dt><dd>${escHtml(data.performedDate)}</dd></div>
        <div class="field"><dt>Pumpetype</dt><dd>${escHtml(data.pumpType || 'Ikke registreret')}</dd></div>
        <div class="field"><dt>Fremløbstemperatur</dt><dd>${data.flowTemperature ? `${escHtml(data.flowTemperature)} &deg;C` : 'Ikke registreret'}</dd></div>
      </dl>
    </section>
    <section class="section">
      <h2>Kredse og indstillinger</h2>
      <table><thead><tr><th>Kreds</th><th>Rum</th><th>Længde (m)</th><th>Forindstilling</th><th>Kanal</th></tr></thead><tbody>${circuitRows}</tbody></table>
    </section>
    <section class="section">
      <h2>Bemærkninger</h2>
      <div class="note">${escHtml(data.remarks || 'Ingen bemærkninger.')}</div>
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

export default function IndreguleringPage() {
  const [supplier, setSupplier] = useState('Wavin')
  const [customer, setCustomer] = useState('KNIK ApS')
  const [room, setRoom] = useState('Bryggers')
  const [pumpType, setPumpType] = useState('')
  const [circuits, setCircuits] = useState<CircuitRow[]>(DEFAULT_CIRCUITS)
  const [flowTemp, setFlowTemp] = useState('35')
  const [remarks, setRemarks] = useState('OK')
  const [performedBy, setPerformedBy] = useState('')
  const [performedDate, setPerformedDate] = useState('2026-02-11')
  const [generating, setGenerating] = useState(false)

  function addCircuit() {
    const next = circuits.length + 1
    setCircuits(prev => [...prev, { circuit: next, room: '', length: '', preSetting: '', channel: '' }])
  }

  function updateCircuit(index: number, field: 'room' | 'length' | 'preSetting' | 'channel', value: string) {
    setCircuits(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  function removeCircuit(index: number) {
    setCircuits(prev => {
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((c, i) => ({ ...c, circuit: i + 1 }))
    })
  }

  function handleGenerate() {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      openIndreguleringReport({
        supplierName: supplier,
        customerName: customer,
        roomName: room,
        pumpType,
        circuits,
        flowTemperature: flowTemp,
        remarks,
        performedBy,
        performedDate,
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
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Gulvvarme indregulering</h1>
        <p className="mt-1 text-sm text-gray-500">Udfyld oplysningerne for at generere et indreguleringsskema.</p>
      </div>

      <div className="space-y-6">
        <Section icon={FileText} title="Projektoplysninger">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Leverandør/system">
              <input value={supplier} onChange={e => setSupplier(e.target.value)} className="input" placeholder="F.eks. Wavin" />
            </Field>
            <Field label="Kunde/projekt">
              <input value={customer} onChange={e => setCustomer(e.target.value)} className="input" placeholder="F.eks. KNIK ApS" />
            </Field>
            <Field label="Rum/område">
              <input value={room} onChange={e => setRoom(e.target.value)} className="input" placeholder="F.eks. Bryggers" />
            </Field>
            <Field label="Udførende">
              <input value={performedBy} onChange={e => setPerformedBy(e.target.value)} className="input" placeholder="F.eks. Rasmus Bak" />
            </Field>
            <Field label="Dato">
              <input type="date" value={performedDate} onChange={e => setPerformedDate(e.target.value)} className="input" />
            </Field>
            <Field label="Pumpetype">
              <input value={pumpType} onChange={e => setPumpType(e.target.value)} className="input" placeholder="F.eks. Grundfos Alpha" />
            </Field>
            <Field label="Fremløbstemperatur (°C)">
              <input type="number" value={flowTemp} onChange={e => setFlowTemp(e.target.value)} className="input" placeholder="F.eks. 35" />
            </Field>
          </div>
        </Section>

        <Section icon={Wrench} title="Kredse og indstillinger">
          <div className="space-y-2">
            <div className="mb-2 hidden grid-cols-[3rem_1fr_1fr_1fr_1fr] gap-2 px-1 text-xs font-medium text-gray-400 sm:grid">
              <span /><span>Rum</span><span>Længde (m)</span><span>Forindstilling</span><span>Kanal</span>
            </div>
            {circuits.map((circuit, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-2 min-w-[3rem] text-sm font-medium text-gray-500">{circuit.circuit}.</span>
                <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
                  <input value={circuit.room} onChange={e => updateCircuit(i, 'room', e.target.value)} className="input" placeholder="Rum" />
                  <input value={circuit.length} onChange={e => updateCircuit(i, 'length', e.target.value)} className="input" placeholder="Længde" />
                  <input value={circuit.preSetting} onChange={e => updateCircuit(i, 'preSetting', e.target.value)} className="input" placeholder="Forindstilling" />
                  <input value={circuit.channel} onChange={e => updateCircuit(i, 'channel', e.target.value)} className="input" placeholder="Kanal" />
                </div>
                <button onClick={() => removeCircuit(i)} className="mt-0.5 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"><X size={16} /></button>
              </div>
            ))}
            <button onClick={addCircuit} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"><Plus size={14} /> Tilføj kreds</button>
          </div>
        </Section>

        <Section icon={Flag} title="Bemærkninger">
          <Field label="Bemærkninger">
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="input min-h-[60px]" rows={2} placeholder="Eventuelle bemærkninger..." />
          </Field>
        </Section>
      </div>

      <div className="mt-8 flex items-center gap-3 border-t border-gray-200 pt-6">
        <button onClick={handleGenerate} disabled={generating} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
          {generating ? <><Loader2 size={16} className="animate-spin" /> Genererer…</> : <><FileText size={16} /> Generer Gulvvarme indregulering</>}
        </button>
        <Link href="/opret-dokument" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Annuller</Link>
      </div>
    </div>
  )
}
