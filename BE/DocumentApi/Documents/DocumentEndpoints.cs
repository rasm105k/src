using DocumentApi.Domain;

namespace DocumentApi.Documents;

public static class DocumentEndpoints
{
    public static IEndpointRouteBuilder MapDocumentEndpoints(this IEndpointRouteBuilder app)
    {
        var documentTypes = app.MapGroup("/api/document-types").WithTags("Document types");

        documentTypes.MapPost("/", async (
            CreateDocumentTypeRequest request,
            IDocumentRepository repository,
            CancellationToken cancellationToken) =>
        {
            var errors = DocumentRequestValidator.ValidateDocumentType(request);
            if (errors.Count > 0)
            {
                return Validation(errors);
            }

            var created = await repository.CreateDocumentTypeAsync(request, cancellationToken);
            return Results.Created($"/api/document-types/{created.Id}", created);
        });

        documentTypes.MapGet("/", async (
            bool? includeInactive,
            IDocumentRepository repository,
            CancellationToken cancellationToken) =>
        {
            var result = await repository.ListDocumentTypesAsync(includeInactive ?? false, cancellationToken);
            return Results.Ok(result);
        });

        var reports = app.MapGroup("/api/reports").WithTags("Reports");

        reports.MapPost("/", async (
            CreateReportRequest request,
            IDocumentRepository repository,
            CancellationToken cancellationToken) =>
        {
            var errors = DocumentRequestValidator.ValidateCreateReport(request);
            if (errors.Count > 0)
            {
                return Validation(errors);
            }

            var created = await repository.CreateReportAsync(request, cancellationToken);
            return Results.Created($"/api/reports/{created.Id}", created);
        });

        reports.MapGet("/", async (
            Guid? organizationId,
            Guid? documentTypeId,
            string? status,
            string? reviewStatus,
            int? limit,
            int? offset,
            IDocumentRepository repository,
            CancellationToken cancellationToken) =>
        {
            if (!string.IsNullOrWhiteSpace(status) && !ReportStatuses.All.Contains(status))
            {
                return Validation([new("status", $"status must be one of: {string.Join(", ", ReportStatuses.All)}.")]);
            }

            if (!string.IsNullOrWhiteSpace(reviewStatus) && !ReviewStatuses.All.Contains(reviewStatus))
            {
                return Validation([new("reviewStatus", $"reviewStatus must be one of: {string.Join(", ", ReviewStatuses.All)}.")]);
            }

            var query = new ReportQuery(
                organizationId,
                documentTypeId,
                status,
                reviewStatus,
                Math.Clamp(limit ?? 50, 1, 200),
                Math.Max(offset ?? 0, 0));

            return Results.Ok(await repository.ListReportsAsync(query, cancellationToken));
        });

        reports.MapGet("/{id:guid}", async (
            Guid id,
            IDocumentRepository repository,
            CancellationToken cancellationToken) =>
        {
            var report = await repository.GetReportAsync(id, cancellationToken);
            return report is null ? Results.NotFound() : Results.Ok(report);
        });

        reports.MapPatch("/{id:guid}", async (
            Guid id,
            UpdateReportRequest request,
            IDocumentRepository repository,
            CancellationToken cancellationToken) =>
        {
            var errors = DocumentRequestValidator.ValidateUpdateReport(request);
            if (errors.Count > 0)
            {
                return Validation(errors);
            }

            var updated = await repository.UpdateReportAsync(id, request, cancellationToken);
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        });

        reports.MapPost("/{id:guid}/files", async (
            Guid id,
            DocumentFileRequest request,
            IDocumentRepository repository,
            CancellationToken cancellationToken) =>
        {
            var errors = DocumentRequestValidator.ValidateFile(request);
            if (errors.Count > 0)
            {
                return Validation(errors);
            }

            var created = await repository.AddFileAsync(id, request, cancellationToken);
            return created is null ? Results.NotFound() : Results.Created($"/api/reports/{id}/files/{created.Id}", created);
        });

        reports.MapPut("/{id:guid}/fields", async (
            Guid id,
            ReportFieldRequest request,
            IDocumentRepository repository,
            CancellationToken cancellationToken) =>
        {
            var errors = DocumentRequestValidator.ValidateField(request);
            if (errors.Count > 0)
            {
                return Validation(errors);
            }

            var upserted = await repository.UpsertFieldAsync(id, request, cancellationToken);
            return upserted is null ? Results.NotFound() : Results.Ok(upserted);
        });

        return app;
    }

    private static IResult Validation(IReadOnlyList<DocumentValidationError> errors) =>
        Results.ValidationProblem(errors
            .GroupBy(error => error.Field)
            .ToDictionary(group => group.Key, group => group.Select(error => error.Message).ToArray()));
}
