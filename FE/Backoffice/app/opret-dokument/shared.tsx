import { FileText } from 'lucide-react'
import { escHtml } from '../_components/ui'

export function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
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

export function Field({ label, children, fullWidth }: { label: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <label className={`block ${fullWidth ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-xs font-medium text-gray-400">{label}</span>
      {children}
    </label>
  )
}
