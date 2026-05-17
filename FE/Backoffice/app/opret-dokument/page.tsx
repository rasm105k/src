import Link from 'next/link'
import { ArrowLeft, FileText, Building2, Wrench } from 'lucide-react'

const DOCUMENT_TYPES = [
  {
    id: 'qcontrol',
    label: 'Q-kontrol rapport',
    description: 'Formel Q-kontrol rapport med kontrolpunkter, signatur og tidslinje',
    icon: FileText,
    href: '/opret-dokument/qcontrol',
  },
  {
    id: 'drift-vedligehold',
    label: 'Drift- og vedligeholdelsesdokumentation',
    description: 'Drift- og vedligeholdelsesmappe med virksomhedsoplysninger, leverandørkontakter og vedligeholdelsesplan',
    icon: Building2,
    href: '/opret-dokument/drift-vedligehold',
  },
  {
    id: 'indregulering',
    label: 'Gulvvarme indregulering',
    description: 'Indreguleringsskema for gulvvarme med kredstabel, fremløbstemperatur og bemærkninger',
    icon: Wrench,
    href: '/opret-dokument/indregulering',
  },
]

export default function ChooseDocumentType() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700">
          <ArrowLeft size={14} />
          Tilbage til oversigt
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Opret dokument</h1>
        <p className="mt-1 text-sm text-gray-500">Vælg en dokumenttype for at komme i gang.</p>
      </div>

      <div className="space-y-3">
        {DOCUMENT_TYPES.map(type => (
          <Link
            key={type.id}
            href={type.href}
            className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <type.icon size={20} className="text-gray-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900">{type.label}</h2>
              <p className="mt-0.5 text-sm text-gray-500">{type.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
