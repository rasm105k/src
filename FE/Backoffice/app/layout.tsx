import type { Metadata } from 'next'
import './globals.css'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Workslip Backoffice',
  description: 'Administration af workslips',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="da">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
