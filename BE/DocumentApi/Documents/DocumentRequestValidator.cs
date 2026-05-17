using DocumentApi.Domain;

namespace DocumentApi.Documents;

public static class DocumentRequestValidator
{
    public static IReadOnlyList<DocumentValidationError> ValidateDocumentType(CreateDocumentTypeRequest request)
    {
        var errors = new List<DocumentValidationError>();

        Required(request.Code, "code", errors);
        Required(request.Name, "name", errors);

        if (request.Version < 1)
        {
            errors.Add(new("version", "Version must be 1 or greater."));
        }

        foreach (var field in request.Fields)
        {
            Required(field.FieldKey, "fields.fieldKey", errors);
            Required(field.Label, "fields.label", errors);
            MustBeOneOf(field.DataType, FieldDataTypes.All, "fields.dataType", errors);
        }

        return errors;
    }

    public static IReadOnlyList<DocumentValidationError> ValidateCreateReport(CreateReportRequest request)
    {
        var errors = new List<DocumentValidationError>();

        if (request.OrganizationId == Guid.Empty)
        {
            errors.Add(new("organizationId", "organizationId is required."));
        }

        if (request.DocumentTypeId == Guid.Empty)
        {
            errors.Add(new("documentTypeId", "documentTypeId is required."));
        }

        if (request.Status is not null)
        {
            MustBeOneOf(request.Status, ReportStatuses.All, "status", errors);
        }

        if (request.ReviewStatus is not null)
        {
            MustBeOneOf(request.ReviewStatus, ReviewStatuses.All, "reviewStatus", errors);
        }

        ValidateReviewScore(request.ReviewScore, errors);

        foreach (var file in request.Files)
        {
            ValidateFile(file, errors);
        }

        foreach (var field in request.Fields)
        {
            ValidateField(field, errors);
        }

        return errors;
    }

    public static IReadOnlyList<DocumentValidationError> ValidateUpdateReport(UpdateReportRequest request)
    {
        var errors = new List<DocumentValidationError>();

        if (request.Status is not null)
        {
            MustBeOneOf(request.Status, ReportStatuses.All, "status", errors);
        }

        if (request.ReviewStatus is not null)
        {
            MustBeOneOf(request.ReviewStatus, ReviewStatuses.All, "reviewStatus", errors);
        }

        ValidateReviewScore(request.ReviewScore, errors);
        return errors;
    }

    public static IReadOnlyList<DocumentValidationError> ValidateFile(DocumentFileRequest request)
    {
        var errors = new List<DocumentValidationError>();
        ValidateFile(request, errors);
        return errors;
    }

    public static IReadOnlyList<DocumentValidationError> ValidateField(ReportFieldRequest request)
    {
        var errors = new List<DocumentValidationError>();
        ValidateField(request, errors);
        return errors;
    }

    private static void ValidateFile(DocumentFileRequest file, List<DocumentValidationError> errors)
    {
        MustBeOneOf(file.Purpose, DocumentFilePurposes.All, "files.purpose", errors);
        Required(file.StorageAccountName, "files.storageAccountName", errors);
        Required(file.ContainerName, "files.containerName", errors);
        Required(file.BlobName, "files.blobName", errors);
        Required(file.FileName, "files.fileName", errors);
        Required(file.ContentType, "files.contentType", errors);

        if (file.FileSizeBytes < 0)
        {
            errors.Add(new("files.fileSizeBytes", "File size must be 0 or greater."));
        }
    }

    private static void ValidateField(ReportFieldRequest field, List<DocumentValidationError> errors)
    {
        Required(field.FieldKey, "fields.fieldKey", errors);
        Required(field.Label, "fields.label", errors);
        MustBeOneOf(field.DataType, FieldDataTypes.All, "fields.dataType", errors);
        MustBeOneOf(field.Status, FieldStatuses.All, "fields.status", errors);
        MustBeOneOf(field.Source, FieldSources.All, "fields.source", errors);

        if (field.InstanceIndex < 0)
        {
            errors.Add(new("fields.instanceIndex", "Instance index must be 0 or greater."));
        }

        if (field.Confidence is < 0 or > 100)
        {
            errors.Add(new("fields.confidence", "Confidence must be between 0 and 100."));
        }
    }

    private static void ValidateReviewScore(decimal? score, List<DocumentValidationError> errors)
    {
        if (score is < 0 or > 100)
        {
            errors.Add(new("reviewScore", "Review score must be between 0 and 100."));
        }
    }

    private static void Required(string? value, string field, List<DocumentValidationError> errors)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            errors.Add(new(field, $"{field} is required."));
        }
    }

    private static void MustBeOneOf(string? value, ISet<string> allowed, string field, List<DocumentValidationError> errors)
    {
        if (string.IsNullOrWhiteSpace(value) || !allowed.Contains(value))
        {
            errors.Add(new(field, $"{field} must be one of: {string.Join(", ", allowed)}."));
        }
    }
}
