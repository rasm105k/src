import type { Workslip } from './types'
import { closureFlagLabels, installationTypeLabels, workKindLabels } from './mock-data'

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Ikke registreret'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return escapeHtml(value)

  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Ikke registreret'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return escapeHtml(value)

  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function field(label: string, value: unknown): string {
  return `
    <div class="field">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value || 'Ikke registreret')}</dd>
    </div>
  `
}

function missingField(label: string): string {
  return `
    <div class="field missing">
      <dt>${escapeHtml(label)}</dt>
      <dd>Ikke registreret i nuværende datamodel</dd>
    </div>
  `
}

function renderControlStages(workslip: Workslip): string {
  if (workslip.controlStages.length === 0) {
    return '<p class="muted">Ingen kontrolpunkter registreret.</p>'
  }

  return workslip.controlStages
    .map((stage) => {
      const items = stage.checkedItems.length
        ? stage.checkedItems
            .map((item) => `<li><span class="check">OK</span>${escapeHtml(item.label)}</li>`)
            .join('')
        : '<li class="muted">Ingen markerede kontrolpunkter.</li>'

      return `
        <section class="control-stage">
          <div class="stage-header">
            <h3>${escapeHtml(stage.stageTitle)}</h3>
            <span>${escapeHtml(`${stage.checkedItems.length}/${stage.totalItems}`)}</span>
          </div>
          <ul>${items}</ul>
        </section>
      `
    })
    .join('')
}

function hasFinalControl(workslip: Workslip): boolean {
  return workslip.controlStages.some(
    (stage) => stage.stageId === 'slutkontrol' && stage.checkedItems.length > 0
  )
}

export function buildQControlReportHtml(workslip: Workslip): string {
  const installationTypes = workslip.installationTypes
    .map((type) => installationTypeLabels[type])
    .join(', ')

  const workKind = workslip.workKind === 'serviceAndet'
    ? workslip.customWorkKind || workKindLabels[workslip.workKind]
    : workKindLabels[workslip.workKind]

  const closureFlags = workslip.closureFlags.length
    ? workslip.closureFlags.map((flag) => `<span class="pill">${escapeHtml(closureFlagLabels[flag])}</span>`).join('')
    : '<span class="muted">Ingen afslutningsmarkeringer.</span>'
  const finalControlResult = hasFinalControl(workslip)
    ? 'Slutkontrolpunkter registreret'
    : 'Ingen slutkontrolpunkter registreret'

  return `<!doctype html>
<html lang="da">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Q-kontrol rapport - ${escapeHtml(workslip.reportNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f3f4f6;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.45;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 18px auto;
      background: white;
      padding: 18mm;
      box-shadow: 0 18px 50px rgba(15, 23, 42, 0.16);
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      border-bottom: 2px solid #111827;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 25px; letter-spacing: 0; }
    h2 {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #374151;
      margin-bottom: 10px;
    }
    h3 { font-size: 14px; }
    .meta {
      text-align: right;
      font-size: 12px;
      color: #4b5563;
    }
    .section {
      break-inside: avoid;
      border-top: 1px solid #e5e7eb;
      padding-top: 14px;
      margin-top: 16px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 18px;
    }
    .field dt {
      color: #6b7280;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }
    .field dd {
      margin: 2px 0 0;
      font-size: 13px;
      color: #111827;
    }
    .field.missing dd {
      color: #92400e;
      font-weight: 700;
    }
    .full { grid-column: 1 / -1; }
    .pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      border: 1px solid #d1d5db;
      border-radius: 999px;
      padding: 4px 9px;
      font-size: 12px;
      font-weight: 700;
      color: #1f2937;
      background: #f9fafb;
    }
    .control-stage {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 10px;
      overflow: hidden;
    }
    .stage-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 9px 11px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }
    .stage-header span {
      color: #6b7280;
      font-size: 12px;
      font-weight: 700;
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 8px 11px 10px;
    }
    li {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      padding: 4px 0;
      font-size: 12px;
    }
    .check {
      display: inline-flex;
      min-width: 24px;
      justify-content: center;
      border-radius: 4px;
      background: #dcfce7;
      color: #166534;
      font-size: 10px;
      font-weight: 800;
      line-height: 18px;
    }
    .note {
      min-height: 42px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px;
      font-size: 13px;
      background: #fcfcfd;
      white-space: pre-wrap;
    }
    .signature-box {
      min-height: 78px;
      border: 1px dashed #9ca3af;
      border-radius: 8px;
      padding: 10px;
      display: flex;
      align-items: end;
      justify-content: space-between;
      color: #6b7280;
      font-size: 12px;
    }
    .timeline {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .event {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px;
      font-size: 12px;
    }
    .event strong {
      display: block;
      color: #111827;
      margin-bottom: 2px;
    }
    .muted { color: #6b7280; }
    .actions {
      position: sticky;
      top: 0;
      display: flex;
      justify-content: center;
      gap: 8px;
      background: rgba(243, 244, 246, 0.9);
      backdrop-filter: blur(8px);
      padding: 12px;
    }
    .actions button {
      border: 0;
      border-radius: 8px;
      background: #111827;
      color: white;
      cursor: pointer;
      font-weight: 700;
      padding: 10px 14px;
    }
    @page { size: A4; margin: 12mm; }
    @media print {
      body { background: white; }
      .actions { display: none; }
      .page {
        width: auto;
        min-height: auto;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button onclick="window.print()">Gem som PDF / print</button>
  </div>
  <main class="page">
    <header>
      <div>
        <h1>Q-kontrol rapport</h1>
        <p class="muted">Digital 4V05-arbejdsrapport fra Workslip</p>
      </div>
      <div class="meta">
        <strong>${escapeHtml(workslip.reportNumber)}</strong><br />
        Status: ${escapeHtml(workslip.status)}<br />
        Genereret: ${escapeHtml(formatDateTime(new Date().toISOString()))}
      </div>
    </header>

    <section class="section">
      <h2>KLS / kontrolgrundlag</h2>
      <dl class="grid">
        ${field('Rapportnummer', workslip.reportNumber)}
        ${field('Installationsadresse', workslip.address)}
        ${field('Rapportdato', formatDate(workslip.date))}
        ${missingField('Opstartsdato')}
        ${field('Arbejdstype', workKind)}
        ${field('Anlægstype', installationTypes)}
        ${field('Montør / udfører', workslip.technicianName)}
        ${missingField('Slutkontrol udført af')}
        ${field('Slutkontrol dato', formatDate(workslip.signatureDate))}
        ${field('Slutkontrol resultat', finalControlResult)}
        <div class="field full">
          <dt>Omfang / opgavebeskrivelse</dt>
          <dd>${escapeHtml(workslip.description || 'Ikke registreret')}</dd>
        </div>
      </dl>
    </section>

    <section class="section">
      <h2>Kunde og kontoroplysninger</h2>
      <dl class="grid">
        ${field('Kunde', workslip.customerName)}
        ${field('Kontaktperson', workslip.contactPerson)}
        ${field('Telefon', workslip.phone)}
        ${workslip.customerInfo ? `<div class="field full"><dt>Kundeoplysninger</dt><dd>${escapeHtml(workslip.customerInfo)}</dd></div>` : ''}
      </dl>
    </section>

    <section class="section">
      <h2>Kontrolpunkter</h2>
      ${renderControlStages(workslip)}
    </section>

    <section class="section">
      <h2>Bemærkninger og afvigelser</h2>
      <div class="note">${escapeHtml(workslip.remarks || 'Ingen bemærkninger registreret.')}</div>
    </section>

    <section class="section">
      <h2>Afslutning</h2>
      <div class="pills">${closureFlags}</div>
    </section>

    <section class="section">
      <h2>Signatur og ansvar</h2>
      <dl class="grid">
        ${field('Montør / udfører', workslip.technicianName)}
        ${field('Signaturdato', formatDate(workslip.signatureDate))}
      </dl>
      <div class="signature-box">
        <span>Digital signatur/godkendelse</span>
        <span>${escapeHtml(workslip.technicianName || 'Ikke registreret')}</span>
      </div>
    </section>

    <section class="section">
      <h2>Tidslinje</h2>
      <div class="timeline">
        <div class="event">
          <strong>Indsendt</strong>
          ${escapeHtml(formatDateTime(workslip.submittedAt))}
        </div>
        <div class="event">
          <strong>Behandlet</strong>
          ${escapeHtml(formatDateTime(workslip.processedAt))}
        </div>
      </div>
    </section>
  </main>
</body>
</html>`
}

export function openQControlReport(workslip: Workslip): void {
  const popup = window.open('', '_blank', 'width=1100,height=900')

  if (!popup) {
    return
  }

  popup.document.open()
  popup.document.write(buildQControlReportHtml(workslip))
  popup.document.close()
  popup.focus()
}
