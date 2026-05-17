'use client'

import { FileText, Wrench, ClipboardCheck, Flag, Check } from 'lucide-react'
import type { Workslip, InstallationType, ClosureFlag } from '@/lib/types'
import {
  installationTypeLabels,
  workKindLabels,
  closureFlagLabels,
  instColors,
  instList,
  workKindList,
  closureFlagList,
} from '@/lib/constants'
import { controlStageDefs, installationToControlColumns } from '@/lib/mock-data'
import { EditField, StageCollapse } from './ui'
import { Section } from './panel-section'

export function EditContent({
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
