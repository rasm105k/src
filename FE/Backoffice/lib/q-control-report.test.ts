import assert from 'node:assert/strict'
import test from 'node:test'
import { buildQControlReportHtml, openQControlReport } from './q-control-report'
import type { Workslip } from './types'

const sampleWorkslip: Workslip = {
  id: 'WSL-0001',
  reportNumber: '4V05-001',
  customerName: 'Aarhus Ejendomme ApS',
  address: 'Trøjborgvej 12, 8200 Aarhus N',
  contactPerson: 'Mette Jensen',
  phone: '26 75 09 81',
  date: '2026-05-15',
  description: 'Udskiftning af hovedhaner og kontrol af vandinstallation.',
  customerInfo: 'Kunden informeret om service.',
  installationTypes: ['vand'],
  workKind: 'reparation',
  customWorkKind: '',
  controlStages: [
    {
      stageId: 'slutkontrol',
      stageTitle: 'Slutkontrol',
      checkedItems: [
        { id: 'vand-trykproevning', label: 'Trykprøvning' },
        { id: 'vand-tapsteder', label: 'Afprøvning af tapsteder' },
      ],
      totalItems: 6,
    },
  ],
  remarks: 'Alle tæthedsprøver uden anmærkninger.',
  closureFlags: ['faerdig', 'klarTilFaktura'],
  technicianName: 'Niels Petersen',
  signatureDate: '2026-05-15',
  status: 'completed',
  submittedAt: '2026-05-15T10:30:00.000Z',
  processedAt: '2026-05-15T12:00:00.000Z',
  fileSize: 123456,
}

test('builds an audit-ready Q-control report with all visible compliance sections', () => {
  const html = buildQControlReportHtml(sampleWorkslip)

  assert.match(html, /Q-kontrol rapport/)
  assert.match(html, /KLS \/ kontrolgrundlag/)
  assert.match(html, /Kunde og kontoroplysninger/)
  assert.match(html, /4V05-001/)
  assert.match(html, /Aarhus Ejendomme ApS/)
  assert.match(html, /Trøjborgvej 12, 8200 Aarhus N/)
  assert.match(html, /Reparation/)
  assert.match(html, /Vand/)
  assert.match(html, /Slutkontrol/)
  assert.match(html, /Trykprøvning/)
  assert.match(html, /2\/6/)
  assert.match(html, /Færdig/)
  assert.match(html, /Klar til faktura/)
  assert.match(html, /Niels Petersen/)
  assert.match(html, /Slutkontrol udført af/)
  assert.match(html, /Ikke registreret i nuværende datamodel/)
  assert.match(html, /Indsendt/)
  assert.match(html, /Behandlet/)
})

test('escapes report values before embedding them in printable HTML', () => {
  const html = buildQControlReportHtml({
    ...sampleWorkslip,
    customerName: '<script>alert("x")</script>',
  })

  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/)
})

test('opens a writable report window and writes the generated HTML into it', () => {
  const writes: string[] = []
  let features = ''
  const fakeWindow = {
    document: {
      open() {
        writes.push('OPEN')
      },
      write(html: string) {
        writes.push(html)
      },
      close() {
        writes.push('CLOSE')
      },
    },
    focus() {
      writes.push('FOCUS')
    },
  }

  const previousWindow = globalThis.window
  ;(globalThis as any).window = {
    open(_url: string, _target: string, requestedFeatures: string) {
      features = requestedFeatures
      return fakeWindow
    },
  }

  try {
    openQControlReport(sampleWorkslip)
  } finally {
    ;(globalThis as any).window = previousWindow
  }

  assert.doesNotMatch(features, /noopener|noreferrer/)
  assert.equal(writes[0], 'OPEN')
  assert.match(writes[1], /Q-kontrol rapport/)
  assert.match(writes[1], /4V05-001/)
  assert.equal(writes[2], 'CLOSE')
  assert.equal(writes[3], 'FOCUS')
})
