using System.Text.Json;
using System.Text.Json.Nodes;
using DocumentApi.Domain;

namespace DocumentApi.Documents;

public static class DocumentViewModelMapper
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static DocumentViewModelResponse ToTemplateViewModel(DocumentTypeResponse documentType) =>
        Build(documentType, report: null);

    public static DocumentViewModelResponse ToReportViewModel(DocumentTypeResponse documentType, ReportResponse report)
    {
        if (documentType.Id != report.DocumentTypeId)
        {
            throw new ArgumentException("Report document type does not match template document type.", nameof(report));
        }

        return Build(documentType, report);
    }

    private static DocumentViewModelResponse Build(DocumentTypeResponse documentType, ReportResponse? report)
    {
        var sections = BuildSections(documentType, report);

        return new DocumentViewModelResponse(
            report?.Id,
            report?.OrganizationId,
            documentType.Id,
            documentType.Code,
            documentType.Name,
            documentType.Version,
            report?.CustomerId,
            report?.SiteId,
            report?.CaseId,
            report?.ReportNumber,
            report?.Title,
            report?.Status,
            report?.ReviewStatus,
            report?.ReviewScore,
            report?.OriginalFileId,
            report?.GeneratedPdfFileId,
            sections,
            report?.Files.Select(ToFileViewModel).ToArray() ?? []);
    }

    private static IReadOnlyList<DocumentSectionViewModelResponse> BuildSections(DocumentTypeResponse documentType, ReportResponse? report)
    {
        var fieldsByKey = documentType.Fields.ToDictionary(field => field.FieldKey, StringComparer.OrdinalIgnoreCase);
        var reportFieldsByKey = (report?.Fields ?? [])
            .GroupBy(field => field.FieldKey, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.OrderBy(field => field.InstanceIndex).ToArray(), StringComparer.OrdinalIgnoreCase);

        var usedFieldKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var sections = new List<DocumentSectionViewModelResponse>();

        foreach (var section in GetSchemaSections(documentType))
        {
            var sectionFields = new List<DocumentFieldViewModelResponse>();
            foreach (var fieldKey in section.FieldKeys)
            {
                if (!fieldsByKey.TryGetValue(fieldKey, out var typeField))
                {
                    continue;
                }

                usedFieldKeys.Add(typeField.FieldKey);
                sectionFields.AddRange(BuildTemplateFieldInstances(typeField, reportFieldsByKey));
            }

            if (sectionFields.Count > 0)
            {
                sections.Add(new DocumentSectionViewModelResponse(
                    section.Id,
                    section.Title,
                    section.Order,
                    sectionFields.OrderBy(field => field.Order).ThenBy(field => field.InstanceIndex).ThenBy(field => field.Key).ToArray()));
            }
        }

        var remainingTypeFields = documentType.Fields
            .Where(field => !usedFieldKeys.Contains(field.FieldKey))
            .GroupBy(field => GetFallbackSection(field.FieldKey));

        foreach (var group in remainingTypeFields)
        {
            var sectionFields = group
                .OrderBy(field => field.SortOrder)
                .ThenBy(field => field.FieldKey)
                .SelectMany(field =>
                {
                    usedFieldKeys.Add(field.FieldKey);
                    return BuildTemplateFieldInstances(field, reportFieldsByKey);
                })
                .ToArray();

            sections.Add(new DocumentSectionViewModelResponse(
                group.Key.Id,
                group.Key.Title,
                group.Min(field => field.SortOrder),
                sectionFields));
        }

        var extraFields = reportFieldsByKey
            .Where(pair => !fieldsByKey.ContainsKey(pair.Key))
            .SelectMany(pair => pair.Value.Select(ToExtraFieldViewModel))
            .OrderBy(field => field.Key)
            .ThenBy(field => field.InstanceIndex)
            .ToArray();

        if (extraFields.Length > 0)
        {
            sections.Add(new DocumentSectionViewModelResponse("extra", "Ekstra felter", int.MaxValue, extraFields));
        }

        return sections
            .OrderBy(section => section.Order)
            .ThenBy(section => section.Title)
            .ToArray();
    }

    private static IEnumerable<DocumentFieldViewModelResponse> BuildTemplateFieldInstances(
        DocumentTypeFieldResponse typeField,
        IReadOnlyDictionary<string, ReportFieldResponse[]> reportFieldsByKey)
    {
        if (!reportFieldsByKey.TryGetValue(typeField.FieldKey, out var reportFields))
        {
            yield return ToFieldViewModel(typeField, reportField: null);
            yield break;
        }

        foreach (var reportField in reportFields)
        {
            yield return ToFieldViewModel(typeField, reportField);
        }
    }

    private static DocumentFieldViewModelResponse ToFieldViewModel(DocumentTypeFieldResponse typeField, ReportFieldResponse? reportField)
    {
        var value = ToValueViewModel(reportField);

        return new DocumentFieldViewModelResponse(
            typeField.FieldKey,
            reportField?.InstanceIndex ?? 0,
            typeField.Label,
            typeField.DataType,
            typeField.IsRequired,
            typeField.SortOrder,
            Clone(typeField.Options),
            value,
            reportField?.Confidence,
            reportField?.Status ?? (typeField.IsRequired ? FieldStatuses.Missing : null),
            reportField?.Source,
            Clone(reportField?.BoundingRegions));
    }

    private static DocumentFieldViewModelResponse ToExtraFieldViewModel(ReportFieldResponse reportField)
    {
        var value = ToValueViewModel(reportField);

        return new DocumentFieldViewModelResponse(
            reportField.FieldKey,
            reportField.InstanceIndex,
            reportField.Label,
            reportField.DataType,
            Required: false,
            Order: 0,
            Options: null,
            value,
            reportField.Confidence,
            reportField.Status,
            reportField.Source,
            Clone(reportField.BoundingRegions));
    }

    private static DocumentFieldValueViewModelResponse ToValueViewModel(ReportFieldResponse? reportField)
    {
        if (reportField is null)
        {
            return new DocumentFieldValueViewModelResponse(null, null, null, null, null);
        }

        var json = Clone(reportField.Value);
        var display = FirstText(reportField.CorrectedValue, reportField.NormalizedValue, reportField.RawValue)
            ?? json?.ToJsonString(JsonOptions);

        return new DocumentFieldValueViewModelResponse(
            reportField.RawValue,
            reportField.NormalizedValue,
            reportField.CorrectedValue,
            json,
            display);
    }

    private static DocumentFileViewModelResponse ToFileViewModel(DocumentFileResponse file) =>
        new(
            file.Id,
            file.Purpose,
            file.FileName,
            file.ContentType,
            file.FileSizeBytes,
            file.StorageAccountName,
            file.ContainerName,
            file.BlobName,
            file.BlobVersionId,
            file.CreatedAt);

    private static IReadOnlyList<SchemaSection> GetSchemaSections(DocumentTypeResponse documentType)
    {
        if (documentType.Schema?["sections"] is not JsonArray sectionNodes)
        {
            return [];
        }

        return sectionNodes
            .OfType<JsonObject>()
            .Select(section =>
            {
                var fieldKeys = section["fieldKeys"] is JsonArray keys
                    ? keys.Select(node => node?.GetValue<string>()).Where(key => !string.IsNullOrWhiteSpace(key)).Cast<string>().ToArray()
                    : [];

                return new SchemaSection(
                    section["id"]?.GetValue<string>() ?? ToSlug(section["title"]?.GetValue<string>() ?? "section"),
                    section["title"]?.GetValue<string>() ?? "Sektion",
                    section["order"]?.GetValue<int>() ?? 0,
                    fieldKeys);
            })
            .Where(section => section.FieldKeys.Count > 0)
            .OrderBy(section => section.Order)
            .ThenBy(section => section.Title)
            .ToArray();
    }

    private static FallbackSection GetFallbackSection(string fieldKey)
    {
        var prefix = fieldKey.Split('.', 2)[0];
        return prefix switch
        {
            "customer" => new("customer", "Kunde"),
            "site" => new("site", "Adresse"),
            "case" => new("case", "Sag"),
            "task" => new("task", "Opgave"),
            "performed" => new("performed", "Udførelse"),
            "technician" => new("technician", "Montør"),
            "signature" => new("signature", "Attestering"),
            "company" => new("company", "Virksomhed"),
            "audit" => new("audit", "Audit"),
            "supplier" => new("supplier", "Leverandør"),
            "maintenance" => new("maintenance", "Vedligehold"),
            "flow" => new("flow", "Indregulering"),
            "circuit" => new("circuit", "Kredse"),
            "product" => new("product", "Produkt"),
            "vendor" => new("vendor", "Leverandør"),
            "note" => new("note", "Notat"),
            "amount" => new("amount", "Beløb"),
            "labor" => new("labor", "Timer"),
            "next" => new("next", "Næste handling"),
            _ => new(prefix, "Øvrige felter")
        };
    }

    private static string? FirstText(params string?[] values) =>
        values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));

    private static JsonObject? Clone(JsonObject? value) =>
        value is null ? null : JsonNode.Parse(value.ToJsonString(JsonOptions)) as JsonObject;

    private static string ToSlug(string value)
    {
        var chars = value
            .Trim()
            .ToLowerInvariant()
            .Select(c => char.IsLetterOrDigit(c) ? c : '-')
            .ToArray();

        return string.Join('-', new string(chars).Split('-', StringSplitOptions.RemoveEmptyEntries));
    }

    private sealed record SchemaSection(string Id, string Title, int Order, IReadOnlyList<string> FieldKeys);

    private sealed record FallbackSection(string Id, string Title);
}
