export type WorkslipStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Workslip {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  projectName: string
  description: string
  status: WorkslipStatus
  fileName: string
  fileSize: number
  submittedAt: string
  processedAt: string | null
  metadata: Record<string, string>
}
