import { Clock } from 'lucide-react'
import type { Workslip } from '@/lib/types'
import { Section } from './panel-section'

interface VersionEntry {
  version: number
  at: string
  actor: string
  changes: { field: string; oldValue: string; newValue: string }[]
}

export function VersionPanel({ entries, workslip, onClose }: { entries: VersionEntry[]; workslip: Workslip; onClose: () => void }) {
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
