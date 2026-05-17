using System.Text.Json.Nodes;
using DocumentApi.Domain;

namespace DocumentApi.Workslips;

public sealed record ControlCheckRequest(
    string StageId,
    string ColumnId,
    string ItemId,
    bool Checked,
    string? Note);

public sealed record ControlCheckResponse(
    Guid Id,
    string StageId,
    string ColumnId,
    string ItemId,
    bool Checked,
    string? Note,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CreateWorkslipRequest(
    Guid OrganizationId,
    string ReportNumber,
    string CustomerName,
    string CustomerAddress,
    string? ContactPerson,
    string? Phone,
    DateOnly? ReportDate,
    string TaskDescription,
    string? CustomerObservations,
    IReadOnlyList<string> InstallationTypes,
    string WorkKind,
    string? CustomWorkKind,
    string? Remarks,
    IReadOnlyList<string> ClosureFlags,
    JsonObject? Payload,
    IReadOnlyList<ControlCheckRequest> ControlChecks);

public sealed record UpdateWorkslipRequest(
    string? ReportNumber,
    string? CustomerName,
    string? CustomerAddress,
    string? ContactPerson,
    string? Phone,
    DateOnly? ReportDate,
    string? TaskDescription,
    string? CustomerObservations,
    IReadOnlyList<string>? InstallationTypes,
    string? WorkKind,
    string? CustomWorkKind,
    string? Remarks,
    IReadOnlyList<string>? ClosureFlags,
    JsonObject? Payload,
    IReadOnlyList<ControlCheckRequest>? ControlChecks);

public sealed record WorkslipListItemResponse(
    Guid Id,
    Guid OrganizationId,
    string ReportNumber,
    WorkslipStatus Status,
    string CustomerName,
    string CustomerAddress,
    DateOnly? ReportDate,
    IReadOnlyList<string> InstallationTypes,
    string WorkKind,
    string? CustomWorkKind,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? SubmittedAt);

public sealed record WorkslipReportResponse(
    Guid Id,
    Guid OrganizationId,
    string ReportNumber,
    WorkslipStatus Status,
    string CustomerName,
    string CustomerAddress,
    string? ContactPerson,
    string? Phone,
    DateOnly? ReportDate,
    string TaskDescription,
    string? CustomerObservations,
    IReadOnlyList<string> InstallationTypes,
    string WorkKind,
    string? CustomWorkKind,
    string? Remarks,
    IReadOnlyList<string> ClosureFlags,
    JsonObject? Payload,
    IReadOnlyList<ControlCheckResponse> ControlChecks,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? SubmittedAt);

public sealed record WorkslipEventResponse(
    Guid Id,
    Guid ReportId,
    Guid? ActorId,
    string EventType,
    JsonObject? Before,
    JsonObject? After,
    DateTimeOffset CreatedAt);

public sealed record WorkslipValidationError(string Field, string Message);
