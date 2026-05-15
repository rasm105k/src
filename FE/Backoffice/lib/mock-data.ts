import { Workslip, WorkslipStatus, InstallationType, WorkKind, ClosureFlag, ControlStageEntry } from './types'

const customers = [
  { name: 'Aarhus Ejendomme ApS', address: 'Trøjborgvej 12, 8200 Aarhus N', contact: 'Mette Jensen', phone: '26 75 09 81' },
  { name: 'Boligforeningen Ringgården', address: 'Ringgade 45, 8000 Aarhus C', contact: 'Peter Mortensen', phone: '22 14 88 32' },
  { name: 'Djursland Landbrug A/S', address: 'Agrovej 7, 8500 Grenaa', contact: 'Hans Nielsen', phone: '61 22 45 78' },
  { name: 'Midtjysk Varmeservice', address: 'Varmevej 3, 7400 Herning', contact: 'Lone Kristensen', phone: '29 84 11 56' },
  { name: 'Sydhavnens Ejendomsservice', address: 'Havnegade 88, 2450 København SV', contact: 'Lars Thomsen', phone: '31 45 67 89' },
  { name: 'Nordjyske Boliger', address: 'Nordvestvej 21, 9000 Aalborg', contact: 'Søren Poulsen', phone: '42 36 78 12' },
  { name: 'Vestsjællands Vand & Varme', address: 'Vandværksvej 6, 4200 Slagelse', contact: 'Anne Mette Hansen', phone: '23 45 67 10' },
  { name: 'Fynske Installatører', address: 'Fynsvej 33, 5000 Odense C', contact: 'Jens Christiansen', phone: '27 89 01 23' },
]

const descriptions = [
  'Udskiftning af hovedhaner og installation af ny varmtvandsbeholder',
  'Eftersyn og reparation af gasfyr inkl. tæthedsprøvning',
  'Ny vandinstallation til køkken og bryggers',
  'Renovering af afløbssystem i kælderetage',
  'Installation af ny cirkulationspumpe og varmefordeling',
  'Tilslutning af nyt badeværelse til vand og afløb',
  'Årligt serviceeftersyn på varmeanlæg',
  'Udvidelse af eksisterende gasinstallation til ny kogeø',
]

const customerInfos = [
  'Kunden informeret om behov for årligt serviceeftersyn.',
  'Gamle rør bør overvejes udskiftet inden for 2 år.',
  'Trykket var for lavt grundet kalk. Filter renset.',
  'Anbefaler isolering af uisolerede rør på loftet.',
  'Afløb var delvist tilstoppet – renset med slange.',
  'Varmtvandstemperatur justeret til 55°C som anbefalet.',
  '',
  'Måler monteret. Kunde bedes aflæse om 14 dage.',
]

const remarksList = [
  'Alle tæthedsprøver uden anmærkninger.',
  'Afvigelse: et samrør havde utæthed – udbedret på stedet.',
  'Trykprøvning OK. Anlægget er driftsklart.',
  'Gasinstallation funktionsafprøvet – ingen fejl.',
  'Vandkvalitet målt – ok.',
  '',
  'Afprøvning af installationsgenstande uden anmærkninger.',
]

const technicians = ['Niels Petersen', 'Thomas Mikkelsen', 'Kim Andersen', 'Rasmus Bæk', 'Morten Hjort', 'Lasse Jensen']

const installationTypeLabels: Record<InstallationType, string> = {
  gas: 'Gas',
  vand: 'Vand',
  aflob: 'Afløb',
  varme: 'Varme',
}

const workKindLabels: Record<WorkKind, string> = {
  nyInstallation: 'Ny installation',
  aendring: 'Ændring',
  reparation: 'Reparation',
  serviceAndet: 'Andet',
}

const closureFlagLabels: Record<ClosureFlag, string> = {
  ikkeFaerdig: 'Ikke færdig',
  faerdig: 'Færdig',
  tegninger: 'Tegninger',
  faerdigmelding: 'Færdigmelding',
  driftVedligehold: 'Drifts- og vedligeholdelsesinstruktioner',
  klarTilFaktura: 'Klar til faktura',
}

const controlStageDefs = [
  { id: 'forundersoegelse', title: 'Forundersøgelse', items: { gasVarme: 2, vand: 2, aflob: 4 } },
  { id: 'modtagekontrol', title: 'Modtagekontrol', items: { gasVarme: 4, vand: 4, aflob: 3 } },
  { id: 'udfoerelseskontrol', title: 'Udførelseskontrol', items: { gasVarme: 3, vand: 6, aflob: 2 } },
  { id: 'slutkontrol', title: 'Slutkontrol', items: { gasVarme: 4, vand: 6, aflob: 3 } },
  { id: 'drift-vedligehold', title: 'Drift og vedligehold', items: { gasVarme: 4, vand: 4, aflob: 4 } },
]

const installationToControlColumn: Record<InstallationType, string> = {
  gas: 'gasVarme',
  varme: 'gasVarme',
  vand: 'vand',
  aflob: 'aflob',
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomSubset<T>(arr: T[]): T[] {
  const count = Math.floor(Math.random() * arr.length) + 1
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function randomDate(daysBack: number): string {
  const d = new Date()
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack))
  d.setHours(Math.floor(Math.random() * 12) + 8)
  d.setMinutes(Math.floor(Math.random() * 60))
  return d.toISOString()
}

let reportCounter = 0

export function generateSingleWorkslip(filename: string): Workslip {
  reportCounter++
  const customer = randomItem(customers)
  const installations = randomSubset(['gas', 'vand', 'aflob', 'varme'] as InstallationType[])
  const workKind = randomItem(['nyInstallation', 'aendring', 'reparation', 'serviceAndet'] as WorkKind[])
  const status = 'pending'
  const submitted = new Date().toISOString()
  const technician = randomItem(technicians)

  const activeColumns = [...new Set(installations.map(i => installationToControlColumn[i]))]

  const controlStages: ControlStageEntry[] = controlStageDefs
    .filter(stageDef =>
      activeColumns.some(col => (stageDef.items as any)[col])
    )
    .map(stageDef => {
      const totalItems = activeColumns.reduce((sum, col) => sum + ((stageDef.items as any)[col] || 0), 0)
      const checkedItemIds: string[] = []
      return {
        stageId: stageDef.id,
        stageTitle: stageDef.title,
        checkedItemIds,
        totalItems,
      }
    })

  const closureFlags = ['faerdig'] as ClosureFlag[]

  return {
    id: `WSL-${String(reportCounter).padStart(4, '0')}`,
    reportNumber: `4V05-${String(reportCounter).padStart(3, '0')}`,
    customerName: customer.name,
    address: customer.address,
    contactPerson: customer.contact,
    phone: customer.phone,
    date: new Date().toISOString().split('T')[0],
    description: randomItem(descriptions),
    customerInfo: '',
    installationTypes: installations,
    workKind,
    customWorkKind: workKind === 'serviceAndet' ? 'Serviceeftersyn og rengøring' : '',
    controlStages,
    remarks: '',
    closureFlags,
    technicianName: technician,
    signatureDate: new Date().toISOString().split('T')[0],
    status,
    submittedAt: submitted,
    processedAt: null,
    fileSize: Math.floor(Math.random() * 5000000) + 100000,
  }
}

export function generateMockWorkslips(count: number): Workslip[] {
  return Array.from({ length: count }, () => {
    reportCounter++
    const customer = randomItem(customers)
    const installations = randomSubset(['gas', 'vand', 'aflob', 'varme'] as InstallationType[])
    const workKind = randomItem(['nyInstallation', 'aendring', 'reparation', 'serviceAndet'] as WorkKind[])
    const status = randomItem(['pending', 'processing', 'completed', 'failed'] as WorkslipStatus[])
    const submitted = randomDate(60)
    const processed = status === 'completed' || status === 'failed'
      ? new Date(new Date(submitted).getTime() + Math.random() * 3600000 * 48).toISOString()
      : null
    const technician = randomItem(technicians)

    const activeColumns = [...new Set(installations.map(i => installationToControlColumn[i]))]

    const controlStages: ControlStageEntry[] = controlStageDefs
      .filter(stageDef =>
        activeColumns.some(col => (stageDef.items as any)[col])
      )
      .map(stageDef => {
        const totalItems = activeColumns.reduce((sum, col) => sum + ((stageDef.items as any)[col] || 0), 0)
        const checked = Math.random() > 0.2 ? totalItems : Math.floor(totalItems * (Math.random() * 0.6 + 0.3))
        const checkedItemIds = Array.from({ length: checked }, (_, i) => `${stageDef.id}-${i}`)
        return {
          stageId: stageDef.id,
          stageTitle: stageDef.title,
          checkedItemIds,
          totalItems,
        }
      })

    const closureFlags = randomSubset(['faerdig', 'faerdigmelding', 'driftVedligehold', 'klarTilFaktura', 'tegninger'] as ClosureFlag[])

    return {
      id: `WSL-${String(reportCounter).padStart(4, '0')}`,
      reportNumber: `4V05-${String(reportCounter).padStart(3, '0')}`,
      customerName: customer.name,
      address: customer.address,
      contactPerson: customer.contact,
      phone: customer.phone,
      date: new Date(submitted).toISOString().split('T')[0],
      description: randomItem(descriptions),
      customerInfo: randomItem(customerInfos),
      installationTypes: installations,
      workKind,
      customWorkKind: workKind === 'serviceAndet' ? 'Serviceeftersyn og rengøring' : '',
      controlStages,
      remarks: randomItem(remarksList),
      closureFlags,
      technicianName: technician,
      signatureDate: new Date(submitted).toISOString().split('T')[0],
      status,
      submittedAt: submitted,
      processedAt: processed,
      fileSize: Math.floor(Math.random() * 5000000) + 100000,
    }
  })
}

export { installationTypeLabels, workKindLabels, closureFlagLabels }
