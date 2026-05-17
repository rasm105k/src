using System.Text.Json.Nodes;

namespace WorkslipApi.Documents;

public sealed record DocumentTypeFieldRequest(
    string FieldKey,
    string Label,
    string DataType,
    bool IsRequired,
    int SortOrder,
    JsonObject? Options);

public sealed record DocumentTypeFieldResponse(
    Guid Id,
    string FieldKey,
    string Label,
    string DataType,
    bool IsRequired,
    int SortOrder,
    JsonObject? Options,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CreateDocumentTypeRequest(
    string Code,
    string Name,
    int Version,
    JsonObject? Schema,
    IReadOnlyList<DocumentTypeFieldRequest> Fields);

public sealed record DocumentTypeResponse(
    Guid Id,
    string Code,
    string Name,
    int Version,
    JsonObject? Schema,
    bool IsActive,
    IReadOnlyList<DocumentTypeFieldResponse> Fields,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record DocumentFileRequest(
    string Purpose,
    string StorageAccountName,
    string ContainerName,
    string BlobName,
    string? BlobVersionId,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    string? Sha256Hash,
    Guid? CreatedByUserId);

public sealed record DocumentFileResponse(
    Guid Id,
    Guid OrganizationId,
    Guid? ReportId,
    string Purpose,
    string StorageAccountName,
    string ContainerName,
    string BlobName,
    string? BlobVersionId,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    string? Sha256Hash,
    DateTimeOffset CreatedAt,
    Guid? CreatedByUserId);

public sealed record ReportFieldRequest(
    string FieldKey,
    int InstanceIndex,
    string Label,
    string DataType,
    string? RawValue,
    string? NormalizedValue,
    string? CorrectedValue,
    JsonObject? Value,
    decimal? Confidence,
    string Status,
    string Source,
    JsonObject? BoundingRegions,
    Guid? CorrectedByUserId);

public sealed record ReportFieldResponse(
    Guid Id,
    Guid ReportId,
    string FieldKey,
    int InstanceIndex,
    string Label,
    string DataType,
    string? RawValue,
    string? NormalizedValue,
    string? CorrectedValue,
    JsonObject? Value,
    decimal? Confidence,
    string Status,
    string Source,
    JsonObject? BoundingRegions,
    Guid? CorrectedByUserId,
    DateTimeOffset? CorrectedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CreateReportRequest(
    Guid OrganizationId,
    Guid DocumentTypeId,
    Guid? CustomerId,
    Guid? SiteId,
    Guid? CaseId,
    string? ReportNumber,
    string? Title,
    string? Status,
    string? ReviewStatus,
    decimal? ReviewScore,
    JsonObject? Payload,
    IReadOnlyList<DocumentFileRequest> Files,
    IReadOnlyList<ReportFieldRequest> Fields);

public sealed record UpdateReportRequest(
    Guid? CustomerId,
    Guid? SiteId,
    Guid? CaseId,
    string? ReportNumber,
    string? Title,
    string? Status,
    string? ReviewStatus,
    decimal? ReviewScore,
    JsonObject? Payload);

public sealed record ReportListItemResponse(
    Guid Id,
    Guid OrganizationId,
    Guid DocumentTypeId,
    string DocumentTypeCode,
    string DocumentTypeName,
    Guid? CustomerId,
    Guid? SiteId,
    Guid? CaseId,
    string? ReportNumber,
    string? Title,
    string Status,
    string ReviewStatus,
    decimal? ReviewScore,
    Guid? OriginalFileId,
    Guid? GeneratedPdfFileId,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? SubmittedAt,
    DateTimeOffset? ApprovedAt,
    Guid? ApprovedByUserId);

public sealed record ReportResponse(
    Guid Id,
    Guid OrganizationId,
    Guid DocumentTypeId,
    string DocumentTypeCode,
    string DocumentTypeName,
    Guid? CustomerId,
    Guid? SiteId,
    Guid? CaseId,
    string? ReportNumber,
    string? Title,
    string Status,
    string ReviewStatus,
    decimal? ReviewScore,
    Guid? OriginalFileId,
    Guid? GeneratedPdfFileId,
    JsonObject? Payload,
    IReadOnlyList<DocumentFileResponse> Files,
    IReadOnlyList<ReportFieldResponse> Fields,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? SubmittedAt,
    DateTimeOffset? ApprovedAt,
    Guid? ApprovedByUserId);

public sealed record DocumentValidationError(string Field, string Message);
