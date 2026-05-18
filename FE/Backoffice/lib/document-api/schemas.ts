import { z } from 'zod'

export const FIELD_DATA_TYPES = ['Text', 'Number', 'Date', 'Boolean', 'Choice', 'MultiChoice', 'Json'] as const

const nullableString = z.string().nullable()
const nullableDateString = z.string().nullable()
const nullableNumber = z.coerce.number().nullable()
const sqlGuidSchema = z.string().regex(
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
  'Invalid SQL GUID',
)
const nullableGuid = sqlGuidSchema.nullable()
const jsonObjectSchema = z.record(z.string(), z.unknown())
const nullableJsonObject = jsonObjectSchema.nullable()

export const documentTypeFieldResponseSchema = z.object({
  id: sqlGuidSchema,
  fieldKey: z.string(),
  label: z.string(),
  dataType: z.enum(FIELD_DATA_TYPES),
  isRequired: z.boolean(),
  sortOrder: z.number(),
  options: nullableJsonObject,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const documentTypeResponseSchema = z.object({
  id: sqlGuidSchema,
  code: z.string(),
  name: z.string(),
  version: z.number(),
  schema: nullableJsonObject,
  isActive: z.boolean(),
  fields: z.array(documentTypeFieldResponseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const reportListItemResponseSchema = z.object({
  id: sqlGuidSchema,
  organizationId: sqlGuidSchema,
  documentTypeId: sqlGuidSchema,
  documentTypeCode: z.string(),
  documentTypeName: z.string(),
  customerId: nullableGuid,
  customerName: nullableString.optional().default(null),
  siteId: nullableGuid,
  caseId: nullableGuid,
  reportNumber: nullableString,
  title: nullableString,
  status: z.string(),
  reviewStatus: z.string(),
  reviewScore: nullableNumber,
  originalFileId: nullableGuid,
  generatedPdfFileId: nullableGuid,
  createdAt: z.string(),
  updatedAt: z.string(),
  submittedAt: nullableDateString,
  approvedAt: nullableDateString,
  approvedByUserId: nullableGuid,
})

export const documentFieldValueViewModelResponseSchema = z.object({
  raw: nullableString,
  normalized: nullableString,
  corrected: nullableString,
  json: nullableJsonObject,
  display: nullableString,
})

export const documentFieldViewModelResponseSchema = z.object({
  key: z.string(),
  instanceIndex: z.number(),
  label: z.string(),
  fieldType: z.string(),
  required: z.boolean(),
  order: z.number(),
  options: nullableJsonObject,
  value: documentFieldValueViewModelResponseSchema,
  confidence: nullableNumber,
  status: nullableString,
  source: nullableString,
  boundingRegions: nullableJsonObject,
})

export const documentSectionViewModelResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number(),
  fields: z.array(documentFieldViewModelResponseSchema),
})

export const documentFileViewModelResponseSchema = z.object({
  id: sqlGuidSchema,
  purpose: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  fileSizeBytes: z.number(),
  storageAccountName: z.string(),
  containerName: z.string(),
  blobName: z.string(),
  blobVersionId: nullableString,
  createdAt: z.string(),
})

export const documentFileResponseSchema = z.object({
  id: sqlGuidSchema,
  organizationId: sqlGuidSchema,
  reportId: nullableGuid,
  purpose: z.string(),
  storageAccountName: z.string(),
  containerName: z.string(),
  blobName: z.string(),
  blobVersionId: nullableString,
  fileName: z.string(),
  contentType: z.string(),
  fileSizeBytes: z.number(),
  sha256Hash: nullableString,
  createdAt: z.string(),
  createdByUserId: nullableGuid,
})

export const reportFieldResponseSchema = z.object({
  id: sqlGuidSchema,
  reportId: sqlGuidSchema,
  fieldKey: z.string(),
  instanceIndex: z.number(),
  label: z.string(),
  dataType: z.string(),
  rawValue: nullableString,
  normalizedValue: nullableString,
  correctedValue: nullableString,
  value: nullableJsonObject,
  confidence: nullableNumber,
  status: z.string(),
  source: z.string(),
  boundingRegions: nullableJsonObject,
  correctedByUserId: nullableGuid,
  correctedAt: nullableDateString,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const reportResponseSchema = z.object({
  id: sqlGuidSchema,
  organizationId: sqlGuidSchema,
  documentTypeId: sqlGuidSchema,
  documentTypeCode: z.string(),
  documentTypeName: z.string(),
  customerId: nullableGuid,
  siteId: nullableGuid,
  caseId: nullableGuid,
  reportNumber: nullableString,
  title: nullableString,
  status: z.string(),
  reviewStatus: z.string(),
  reviewScore: nullableNumber,
  originalFileId: nullableGuid,
  generatedPdfFileId: nullableGuid,
  payload: nullableJsonObject,
  files: z.array(documentFileResponseSchema),
  fields: z.array(reportFieldResponseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  submittedAt: nullableDateString,
  approvedAt: nullableDateString,
  approvedByUserId: nullableGuid,
})

export const documentViewModelResponseSchema = z.object({
  reportId: nullableGuid,
  organizationId: nullableGuid,
  documentTypeId: sqlGuidSchema,
  documentTypeCode: z.string(),
  documentTypeName: z.string(),
  documentTypeVersion: z.number(),
  customerId: nullableGuid,
  siteId: nullableGuid,
  caseId: nullableGuid,
  reportNumber: nullableString,
  title: nullableString,
  status: nullableString,
  reviewStatus: nullableString,
  reviewScore: nullableNumber,
  originalFileId: nullableGuid,
  generatedPdfFileId: nullableGuid,
  sections: z.array(documentSectionViewModelResponseSchema),
  files: z.array(documentFileViewModelResponseSchema),
})

export const documentFieldFormSchema = z.object({
  fieldKey: z
    .string()
    .trim()
    .min(1, 'Felt-key er påkrævet')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Brug kun bogstaver, tal, punktum, underscore og bindestreg'),
  label: z.string().trim().min(1, 'Label er påkrævet'),
  dataType: z.enum(FIELD_DATA_TYPES),
  isRequired: z.boolean(),
  sortOrder: z.number().int('Sortering skal være et heltal').min(0, 'Sortering skal være 0 eller højere'),
  optionsJson: z.string().superRefine((value, ctx) => {
    const trimmed = value.trim()
    if (!trimmed) return

    try {
      const parsed = JSON.parse(trimmed)
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Options skal være et JSON object',
        })
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Options skal være gyldig JSON',
      })
    }
  }),
})

export type FieldDataType = (typeof FIELD_DATA_TYPES)[number]
export type DocumentTypeFieldResponse = z.infer<typeof documentTypeFieldResponseSchema>
export type DocumentTypeResponse = z.infer<typeof documentTypeResponseSchema>
export type ReportListItemResponse = z.infer<typeof reportListItemResponseSchema>
export type DocumentFileResponse = z.infer<typeof documentFileResponseSchema>
export type ReportFieldResponse = z.infer<typeof reportFieldResponseSchema>
export type ReportResponse = z.infer<typeof reportResponseSchema>
export type DocumentViewModelResponse = z.infer<typeof documentViewModelResponseSchema>
export type DocumentSectionViewModelResponse = z.infer<typeof documentSectionViewModelResponseSchema>
export type DocumentFieldViewModelResponse = z.infer<typeof documentFieldViewModelResponseSchema>
export type DocumentFileViewModelResponse = z.infer<typeof documentFileViewModelResponseSchema>
export type DocumentFieldFormValues = z.infer<typeof documentFieldFormSchema>
