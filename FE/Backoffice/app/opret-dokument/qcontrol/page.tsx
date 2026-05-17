'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Building2, CalendarDays, Wrench, Flag, FileSignature, Check, Loader2 } from 'lucide-react'
import { openQControlReport } from '@/lib/q-control-report'
import { generateSingleWorkslip } from '@/lib/mock-data'
import type { Workslip, InstallationType, WorkKind, ClosureFlag } from '@/lib/types'
import { installationTypeLabels, workKindLabels, closureFlagLabels, instColors, instList, workKindList, closureFlagList } from '@/lib/constants'
import { Section, Field } from '../shared'

export default function QControlPage() {
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
  const [generating, setGenerating] = useState(false)

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

  function handleGenerate() {
    setGenerating(true)
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/opret-dokument" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700">
          <ArrowLeft size={14} />
          Tilbage til dokumenttyper
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Q-kontrol rapport</h1>
        <p className="mt-1 text-sm text-gray-500">Udfyld oplysningerne for at generere en Q-kontrol rapport.</p>
      </div>

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
                        active ? instColors[t] : 'text-gray-500 bg-gray-50 ring-gray-200 hover:bg-gray-100'
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

      <div className="mt-8 flex items-center gap-3 border-t border-gray-200 pt-6">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? (
            <><Loader2 size={16} className="animate-spin" /> Genererer…</>
          ) : (
            <><FileText size={16} /> Generer Q-kontrol rapport</>
          )}
        </button>
        <Link
          href="/opret-dokument"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Annuller
        </Link>
      </div>
    </div>
  )
}
