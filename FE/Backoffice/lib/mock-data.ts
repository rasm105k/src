import {
  Workslip,
  WorkslipStatus,
  InstallationType,
  WorkKind,
  ClosureFlag,
  ControlStageEntry,
  CheckedItem,
  ScanReview,
  ExtractedField,
  ReviewStatus,
} from './types'

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

const technicians = ['Rasmus Bak', 'Thomas Mikkelsen', 'Kim Andersen', 'Rasmus Bæk', 'Morten Hjort', 'Lasse Jensen']

const reviewStatuses: ReviewStatus[] = ['needsReview', 'readyForApproval', 'approved', 'rejected']

export const installationTypeLabels: Record<InstallationType, string> = {
  gas: 'Gas',
  vand: 'Vand',
  aflob: 'Afløb',
  varme: 'Varme',
}

export const workKindLabels: Record<WorkKind, string> = {
  nyInstallation: 'Ny installation',
  aendring: 'Ændring',
  reparation: 'Reparation',
  serviceAndet: 'Andet',
}

export const installationToControlColumns: Record<InstallationType, string> = {
  gas: 'gasVarme',
  varme: 'gasVarme',
  vand: 'vand',
  aflob: 'aflob',
}

export const closureFlagLabels: Record<ClosureFlag, string> = {
  ikkeFaerdig: 'Ikke færdig',
  faerdig: 'Færdig',
  tegninger: 'Tegninger',
  faerdigmelding: 'Færdigmelding',
  driftVedligehold: 'Drifts- og vedligeholdelsesinstruktioner',
  klarTilFaktura: 'Klar til faktura',
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

const controlStages = [
  {
    id: 'forundersoegelse',
    title: 'Forundersøgelse',
    items: {
      gasVarme: [{ id: 'gas-ansoegning', label: 'Ansøgning på gas' }],
      vand: [
        { id: 'vand-ansoegning', label: 'Ansøgning på vand' },
        { id: 'vandkvalitet', label: 'Vandkvalitet' },
      ],
      aflob: [
        { id: 'aflob-ansoegning', label: 'Ansøgning på afløb' },
        { id: 'aflob-fald-ledninger-forundersoegelse', label: 'Fald på ledninger' },
        { id: 'aflob-udluftninger-over-tag', label: 'Udluftninger over tag' },
        { id: 'aflob-vakuumventiler', label: 'Vakuumventiler' },
      ],
    },
  },
  {
    id: 'modtagekontrol',
    title: 'Modtagekontrol',
    items: {
      gasVarme: [
        { id: 'gas-roer-fittings', label: 'Rør og fittings' },
        { id: 'gas-armaturer', label: 'Armaturer' },
        { id: 'gas-kedel-vvb', label: 'Kedel / VVB' },
        { id: 'gas-saerlige-komponenter', label: 'Særlige komponenter' },
      ],
      vand: [
        { id: 'vand-roer-fittings', label: 'Rør og fittings' },
        { id: 'vand-armaturer', label: 'Armaturer' },
        { id: 'vand-vvb-veksler', label: 'VVB / veksler' },
        { id: 'vand-saerlige-komponenter', label: 'Særlige komponenter' },
      ],
      aflob: [
        { id: 'aflob-roer-fittings', label: 'Rør og fittings' },
        { id: 'aflob-installationsgenstande-modtage', label: 'Installationsgenstande' },
        { id: 'aflob-saerlige-komponenter', label: 'Særlige komponenter' },
      ],
    },
  },
  {
    id: 'udfoerelseskontrol',
    title: 'Udførelseskontrol',
    items: {
      gasVarme: [
        { id: 'gas-stikledning-indfoering', label: 'Stikledning og indføring' },
        { id: 'gas-roerophaeng', label: 'Rørophæng' },
        { id: 'gas-tilslutning-varmtvand', label: 'Tilslutning til varmtvandsforsyning' },
      ],
      vand: [
        { id: 'vand-stikledning-indfoering', label: 'Stikledning og indføring' },
        { id: 'vand-fordeler', label: 'Fordeler omløber fastsp.' },
        { id: 'vand-koblingsdaaser', label: 'Samling af koblingsdåser' },
        { id: 'vand-tilslutning-varmtvand', label: 'Tilslutning til varmtvandsforsyning' },
        { id: 'vand-fittings-samlet', label: 'Fittings presset, samlet, loddet.' },
        { id: 'vand-roer-vater-lod', label: 'Rør i vater og lod' },
      ],
      aflob: [
        { id: 'aflob-installationsgenstande-udfoerelse', label: 'Installationsgenstande' },
        { id: 'aflob-fald-ledninger-udfoerelse', label: 'Fald på ledninger' },
      ],
    },
  },
  {
    id: 'slutkontrol',
    title: 'Slutkontrol',
    items: {
      gasVarme: [
        { id: 'gas-taethed', label: 'Tæthedsprøvning' },
        { id: 'gas-funktion', label: 'Funktionsafprøvning' },
        { id: 'gas-sikkerhedsarmaturer', label: 'Sikkerhedsarmaturer' },
        { id: 'gas-optaelling-materialer', label: 'Optælling af materialer' },
      ],
      vand: [
        { id: 'vand-trykproevning', label: 'Trykprøvning' },
        { id: 'vand-tapsteder', label: 'Afprøvning af tapsteder' },
        { id: 'vand-varmtvandstemp', label: 'Varmtvandstemp.' },
        { id: 'vand-cirkulation', label: 'Cirkulation' },
        { id: 'vand-sikkerhedsarmaturer', label: 'Sikkerhedsarmaturer' },
        { id: 'vand-optaelling-materialer', label: 'Optælling af materialer' },
      ],
      aflob: [
        { id: 'aflob-taethed', label: 'Tæthedsprøvning' },
        { id: 'aflob-installationsgenstande', label: 'Afprøvning af installationsgenstande' },
        { id: 'aflob-optaelling-materialer', label: 'Optælling af materialer' },
      ],
    },
  },
  {
    id: 'drift-vedligehold',
    title: 'Drift og vedligehold',
    items: {
      gasVarme: [
        { id: 'gas-driftsinstruktion', label: 'Driftsinstruktion' },
        { id: 'gas-vedligehold', label: 'Vedligeholdsinstruktion' },
        { id: 'gas-ventiler', label: 'Ventiler og komponenter' },
        { id: 'gas-saerlige', label: 'Særlige komponenter' },
      ],
      vand: [
        { id: 'vand-driftsinstruktion', label: 'Driftsinstruktion' },
        { id: 'vand-vedligehold', label: 'Vedligeholdsinstruktion' },
        { id: 'vand-ventiler', label: 'Ventiler og armaturer' },
        { id: 'vand-saerlige', label: 'Særlige komponenter' },
      ],
      aflob: [
        { id: 'aflob-driftsinstruktion', label: 'Driftsinstruktion' },
        { id: 'aflob-vedligehold', label: 'Vedligeholdsinstruktion' },
        { id: 'aflob-brugervejledning', label: 'Brugervejledning' },
        { id: 'aflob-saerlige', label: 'Særlige komponenter' },
      ],
    },
  },
]

export const controlStageDefs = controlStages.map(s => ({
  id: s.id,
  title: s.title,
  items: s.items as Record<string, Array<{ id: string; label: string }>>,
}))

function buildControlStages(installations: InstallationType[]): ControlStageEntry[] {
  const activeColumns: string[] = [...new Set(installations.map(i => installationToControlColumns[i]))]

  return controlStages
    .filter(stage =>
      activeColumns.some(col => ((stage.items as any)[col]?.length ?? 0) > 0)
    )
    .map(stage => {
      const allItems: CheckedItem[] = []
      for (const col of activeColumns) {
        const items = (stage.items as any)[col] ?? []
        for (const item of items) {
          allItems.push({ id: item.id, label: item.label })
        }
      }
      const checkedCount = Math.random() > 0.15 ? allItems.length : Math.max(1, Math.floor(allItems.length * (Math.random() * 0.5 + 0.3)))
      const shuffled = [...allItems].sort(() => Math.random() - 0.5)
      const checkedItems = shuffled.slice(0, checkedCount)

      return {
        stageId: stage.id,
        stageTitle: stage.title,
        checkedItems,
        totalItems: allItems.length,
      }
    })
}

function buildReviewFields(workslip: Workslip, score: number): ExtractedField[] {
  const fieldBase: ExtractedField[] = [
    { id: 'customerName', label: 'Kunde', value: workslip.customerName, confidence: Math.min(99, score + 6), status: 'confirmed' },
    { id: 'contactPerson', label: 'Kontaktperson', value: workslip.contactPerson, confidence: Math.min(97, score + 2), status: 'confirmed' },
    { id: 'phone', label: 'Telefon', value: workslip.phone, confidence: Math.min(96, score + 1), status: 'confirmed' },
    { id: 'address', label: 'Adresse', value: workslip.address, confidence: Math.min(98, score + 5), status: 'confirmed' },
    { id: 'date', label: 'Dato', value: workslip.date, confidence: Math.max(65, score - 3), status: score > 78 ? 'confirmed' : 'needsReview', reason: score > 78 ? undefined : 'Datoen er delvist utydelig i scanningen.' },
    { id: 'description', label: 'Opgavebeskrivelse', value: workslip.description, confidence: Math.max(58, score - 12), status: score > 84 ? 'confirmed' : 'needsReview', reason: score > 84 ? undefined : 'Håndskriften er læsbar, men bør kontrolleres.' },
    { id: 'installationTypes', label: 'Anlægstype', value: workslip.installationTypes.map(t => installationTypeLabels[t]).join(', '), confidence: Math.max(68, score - 4), status: 'confirmed' },
    { id: 'workKind', label: 'Arbejdstype', value: workslip.workKind === 'serviceAndet' ? workslip.customWorkKind : workKindLabels[workslip.workKind], confidence: Math.max(60, score - 8), status: score > 72 ? 'confirmed' : 'needsReview', reason: score > 72 ? undefined : 'Afkrydsningen er tæt på feltkanten.' },
    { id: 'technicianName', label: 'Montør', value: workslip.technicianName, confidence: Math.max(52, score - 15), status: score > 80 ? 'confirmed' : 'needsReview', reason: score > 80 ? undefined : 'Navnet kan være fejllæst.' },
    { id: 'signatureDate', label: 'Underskriftsdato', value: workslip.signatureDate, confidence: Math.max(55, score - 10), status: score > 70 ? 'confirmed' : 'missing', reason: score > 70 ? undefined : 'Underskriftsdato blev ikke sikkert aflæst.' },
  ]

  return fieldBase
}

function buildScanReview(workslip: Workslip, filename: string, status: ReviewStatus, uploadedAt: string): ScanReview {
  const baseScore =
    status === 'approved' ? Math.floor(Math.random() * 8) + 91 :
    status === 'readyForApproval' ? Math.floor(Math.random() * 10) + 82 :
    status === 'rejected' ? Math.floor(Math.random() * 12) + 45 :
    Math.floor(Math.random() * 22) + 58
  const fields = buildReviewFields(workslip, baseScore)
  const missingCount = fields.filter(f => f.status === 'missing').length
  const uncertainCount = fields.filter(f => f.status === 'needsReview' || f.status === 'conflict').length
  const issues = [
    ...(missingCount > 0 ? [{ id: 'missing-signature-date', severity: 'high' as const, message: 'Underskriftsdato mangler eller er ikke læst sikkert.' }] : []),
    ...(uncertainCount > 0 ? [{ id: 'uncertain-handwriting', severity: 'medium' as const, message: `${uncertainCount} felter kræver manuel kontrol før godkendelse.` }] : []),
    ...(workslip.controlStages.some(s => s.checkedItems.length < s.totalItems) ? [{ id: 'partial-control', severity: 'low' as const, message: 'Et eller flere kontrolafsnit er kun delvist udfyldt.' }] : []),
  ]

  return {
    status,
    score: baseScore,
    originalFileName: filename,
    uploadedAt,
    processedAt: status === 'uploaded' || status === 'processing' ? null : new Date(new Date(uploadedAt).getTime() + 8 * 60000).toISOString(),
    approvedAt: status === 'approved' ? new Date(new Date(uploadedAt).getTime() + 40 * 60000).toISOString() : null,
    missingCount,
    uncertainCount,
    fields,
    issues,
    events: [
      { id: 'uploaded', at: uploadedAt, actor: 'Kunde', action: 'Uploadet', message: `Scannet rapport modtaget: ${filename}` },
      ...(status === 'uploaded' ? [] : [{ id: 'processed', at: new Date(new Date(uploadedAt).getTime() + 8 * 60000).toISOString(), actor: 'AI', action: 'OCR + LLM', message: 'Felter udtrukket og gennemgangsscore beregnet.' }]),
      ...(status === 'approved' ? [{ id: 'approved', at: new Date(new Date(uploadedAt).getTime() + 40 * 60000).toISOString(), actor: 'Admin', action: 'Godkendt', message: 'Rapporten er manuelt kontrolleret og godkendt.' }] : []),
      ...(status === 'rejected' ? [{ id: 'rejected', at: new Date(new Date(uploadedAt).getTime() + 35 * 60000).toISOString(), actor: 'Admin', action: 'Afvist', message: 'Rapporten kræver ny indsendelse fra virksomheden.' }] : []),
    ],
  }
}

let reportCounter = 0

export function generateSingleWorkslip(filename: string): Workslip {
  reportCounter++
  const customer = randomItem(customers)
  const installations = randomSubset(['gas', 'vand', 'aflob', 'varme'] as InstallationType[])
  const workKind = randomItem(['nyInstallation', 'aendring', 'reparation', 'serviceAndet'] as WorkKind[])
  const submitted = new Date().toISOString()
  const technician = randomItem(technicians)

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
    controlStages: buildControlStages(installations),
    remarks: '',
    closureFlags: ['faerdig'] as ClosureFlag[],
    technicianName: technician,
    signatureDate: new Date().toISOString().split('T')[0],
    status: 'pending' as WorkslipStatus,
    submittedAt: submitted,
    processedAt: null,
    fileSize: Math.floor(Math.random() * 5000000) + 100000,
  }
}

export function generateScannedWorkslip(filename: string): Workslip {
  const workslip = generateSingleWorkslip(filename)
  const status = randomItem(['needsReview', 'readyForApproval'] as ReviewStatus[])

  return {
    ...workslip,
    status: status === 'readyForApproval' ? 'processing' : 'pending',
    submittedAt: new Date().toISOString(),
    scanReview: buildScanReview(workslip, filename, status, new Date().toISOString()),
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

    const workslip: Workslip = {
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
      controlStages: buildControlStages(installations),
      remarks: randomItem(remarksList),
      closureFlags: randomSubset(['faerdig', 'faerdigmelding', 'driftVedligehold', 'klarTilFaktura', 'tegninger'] as ClosureFlag[]),
      technicianName: technician,
      signatureDate: new Date(submitted).toISOString().split('T')[0],
      status,
      submittedAt: submitted,
      processedAt: processed,
      fileSize: Math.floor(Math.random() * 5000000) + 100000,
    }

    if (Math.random() < 0.42) {
      const reviewStatus = status === 'completed'
        ? 'approved'
        : status === 'failed'
          ? 'rejected'
          : randomItem(reviewStatuses.filter(s => s !== 'approved' && s !== 'rejected'))
      workslip.scanReview = buildScanReview(
        workslip,
        `${workslip.reportNumber}-scan.pdf`,
        reviewStatus,
        submitted
      )
    }

    return workslip
  })
}
