import { Building2, User, Phone, MapPin, CalendarDays, ClipboardCheck, Clock, FileText, Wrench, Flag, Check } from 'lucide-react'
import type { Workslip } from '@/lib/types'
import { installationTypeLabels, workKindLabels, closureFlagLabels, instColors } from '@/lib/constants'
import { controlStageDefs, installationToControlColumns } from '@/lib/mock-data'
import { StatusBadge, DetailRow, StageCollapse } from './ui'
import { Section } from './panel-section'

export function WorkslipDetail({ workslip }: { workslip: Workslip }) {
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
