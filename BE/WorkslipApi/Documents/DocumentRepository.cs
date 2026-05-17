namespace WorkslipApi.Documents;

public sealed record ReportQuery(Guid? OrganizationId, Guid? DocumentTypeId, string? Status, string? ReviewStatus, int Limit, int Offset);

public interface IDocumentRepository
{
    Task<DocumentTypeResponse> CreateDocumentTypeAsync(CreateDocumentTypeRequest request, CancellationToken cancellationToken);
    Task<IReadOnlyList<DocumentTypeResponse>> ListDocumentTypesAsync(bool includeInactive, CancellationToken cancellationToken);
    Task<ReportResponse> CreateReportAsync(CreateReportRequest request, CancellationToken cancellationToken);
    Task<IReadOnlyList<ReportListItemResponse>> ListReportsAsync(ReportQuery query, CancellationToken cancellationToken);
    Task<ReportResponse?> GetReportAsync(Guid id, CancellationToken cancellationToken);
    Task<ReportResponse?> UpdateReportAsync(Guid id, UpdateReportRequest request, CancellationToken cancellationToken);
    Task<DocumentFileResponse?> AddFileAsync(Guid reportId, DocumentFileRequest request, CancellationToken cancellationToken);
    Task<ReportFieldResponse?> UpsertFieldAsync(Guid reportId, ReportFieldRequest request, CancellationToken cancellationToken);
}
