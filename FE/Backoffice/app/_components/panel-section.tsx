export function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
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
