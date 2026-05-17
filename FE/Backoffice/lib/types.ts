import type { InstallationType, WorkKind, ClosureFlag, CheckedItem } from './shared/domain-types'
export type { InstallationType, WorkKind, ClosureFlag, CheckedItem }

export type WorkslipStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type ReviewStatus =
  | 'uploaded'
  | 'processing'
  | 'needsReview'
  | 'readyForApproval'
  | 'approved'
  | 'rejected'

export type ExtractedFieldStatus = 'confirmed' | 'needsReview' | 'missing' | 'conflict' | 'corrected'

export type ReviewIssueSeverity = 'low' | 'medium' | 'high'

export interface ControlStageEntry {
  stageId: string
  stageTitle: string
  checkedItems: CheckedItem[]
  totalItems: number
}

export interface ExtractedField {
  id: string
  label: string
  value: string
  confidence: number
  status: ExtractedFieldStatus
  reason?: string
}

export interface ReviewIssue {
  id: string
  severity: ReviewIssueSeverity
  message: string
}

export interface ReviewEvent {
  id: string
  at: string
  actor: string
  action: string
  message: string
}

export interface ScanReview {
  status: ReviewStatus
  score: number
  originalFileName: string
  uploadedAt: string
  processedAt: string | null
  approvedAt: string | null
  missingCount: number
  uncertainCount: number
  fields: ExtractedField[]
  issues: ReviewIssue[]
  events: ReviewEvent[]
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
  scanReview?: ScanReview
}
