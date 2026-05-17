import type { Metadata } from 'next'
import './globals.css'
import { ReactNode } from 'react'
import Link from 'next/link'
import { Database, FilePlus, FileText } from 'lucide-react'
import { QueryProvider } from '@/lib/shared/query-provider'

export const metadata: Metadata = {
  title: 'Workslip Backoffice',
  description: 'Administration af workslips',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="da">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <QueryProvider>
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-gray-900">
                <FileText size={18} className="text-gray-400" />
                Workslip Backoffice
              </Link>
              <nav className="flex items-center gap-1">
                <Link
                  href="/rapporter"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <FileText size={16} />
                  Rapporter
                </Link>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Database size={16} />
                  Admin
                </Link>
                <Link
                  href="/opret-dokument"
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  <FilePlus size={16} />
                  Opret dokument
                </Link>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </QueryProvider>
      </body>
    </html>
  )
}
