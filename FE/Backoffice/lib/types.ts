export type WorkslipStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type InstallationType = 'gas' | 'vand' | 'aflob' | 'varme'

export type WorkKind = 'nyInstallation' | 'aendring' | 'reparation' | 'serviceAndet'

export type ClosureFlag =
  | 'ikkeFaerdig'
  | 'faerdig'
  | 'tegninger'
  | 'faerdigmelding'
  | 'driftVedligehold'
  | 'klarTilFaktura'

export interface CheckedItem {
  id: string
  label: string
}

export interface ControlStageEntry {
  stageId: string
  stageTitle: string
  checkedItems: CheckedItem[]
  totalItems: number
}

export interface Workslip {
  id: string
  reportNumber: string
  customerName: string
  address: string
  contactPerson: string
  phone: string
  date: string
  description: string
  customerInfo: string
  installationTypes: InstallationType[]
  workKind: WorkKind
  customWorkKind: string
  controlStages: ControlStageEntry[]
  remarks: string
  closureFlags: ClosureFlag[]
  technicianName: string
  signatureDate: string
  status: WorkslipStatus
  submittedAt: string
  processedAt: string | null
  fileSize: number
}
