using System.Data;
using System.Text.Json;
using System.Text.Json.Nodes;
using Dapper;
using WorkslipApi.Domain;
using WorkslipApi.Workslips;

namespace WorkslipApi.Data;

public sealed class DapperWorkslipRepository(ISqlConnectionFactory connectionFactory) : IWorkslipRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<WorkslipReportResponse> CreateAsync(CreateWorkslipRequest request, CancellationToken cancellationToken)
    {
        using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        using var transaction = connection.BeginTransaction();

        var now = DateTimeOffset.UtcNow;
        var reportId = Guid.NewGuid();

        await connection.ExecuteAsync(new CommandDefinition(
            """
            insert into dbo.WorkslipReports (
                Id, OrganizationId, ReportNumber, Status, CustomerName, CustomerAddress, ContactPerson, Phone,
                ReportDate, TaskDescription, CustomerObservations, InstallationTypesJson, WorkKind, CustomWorkKind,
                Remarks, ClosureFlagsJson, PayloadJson, CreatedAt, UpdatedAt, SubmittedAt
            )
            values (
                @Id, @OrganizationId, @ReportNumber, @Status, @CustomerName, @CustomerAddress, @ContactPerson, @Phone,
                @ReportDate, @TaskDescription, @CustomerObservations, @InstallationTypesJson, @WorkKind, @CustomWorkKind,
                @Remarks, @ClosureFlagsJson, @PayloadJson, @CreatedAt, @UpdatedAt, null
            );
            """,
            new
            {
                Id = reportId,
                request.OrganizationId,
                request.ReportNumber,
                Status = WorkslipStatus.Draft.ToString(),
                request.CustomerName,
                request.CustomerAddress,
                request.ContactPerson,
                request.Phone,
                request.ReportDate,
                request.TaskDescription,
                request.CustomerObservations,
                InstallationTypesJson = ToJson(request.InstallationTypes),
                request.WorkKind,
                request.CustomWorkKind,
                request.Remarks,
                ClosureFlagsJson = ToJson(request.ClosureFlags),
                PayloadJson = request.Payload?.ToJsonString(JsonOptions),
                CreatedAt = now,
                UpdatedAt = now
            },
            transaction,
            cancellationToken: cancellationToken));

        await UpsertControlChecksAsync(connection, transaction, reportId, request.ControlChecks, now, cancellationToken);
        await InsertEventAsync(connection, transaction, reportId, null, "created", null, ToJsonNode(new { reportId }), now, cancellationToken);

        transaction.Commit();
        return (await GetAsync(reportId, cancellationToken))!;
    }

    public async Task<IReadOnlyList<WorkslipListItemResponse>> ListAsync(WorkslipQuery query, CancellationToken cancellationToken)
    {
        using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        var rows = await connection.QueryAsync<WorkslipReportRow>(new CommandDefinition(
            """
            select *
            from dbo.WorkslipReports
            where (@OrganizationId is null or OrganizationId = @OrganizationId)
              and (@Status is null or Status = @Status)
            order by UpdatedAt desc
            offset @Offset rows fetch next @Limit rows only;
            """,
            new
            {
                query.OrganizationId,
                Status = query.Status?.ToString(),
                query.Limit,
                query.Offset
            },
            cancellationToken: cancellationToken));

        return rows.Select(row => new WorkslipListItemResponse(
            row.Id,
            row.OrganizationId,
            row.ReportNumber,
            ParseStatus(row.Status),
            row.CustomerName,
            row.CustomerAddress,
            ToDateOnly(row.ReportDate),
            FromJsonList(row.InstallationTypesJson),
            row.WorkKind,
            row.CustomWorkKind,
            row.CreatedAt,
            row.UpdatedAt,
            row.SubmittedAt)).ToArray();
    }

    public async Task<WorkslipReportResponse?> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        var row = await connection.QuerySingleOrDefaultAsync<WorkslipReportRow>(new CommandDefinition(
            "select * from dbo.WorkslipReports where Id = @Id;",
            new { Id = id },
            cancellationToken: cancellationToken));

        if (row is null)
        {
            return null;
        }

        var checks = await connection.QueryAsync<WorkslipControlCheckRow>(new CommandDefinition(
            "select * from dbo.WorkslipControlChecks where ReportId = @Id order by StageId, ColumnId, ItemId;",
            new { Id = id },
            cancellationToken: cancellationToken));

        return ToResponse(row, checks);
    }

    public async Task<WorkslipReportResponse?> UpdateAsync(Guid id, UpdateWorkslipRequest request, CancellationToken cancellationToken)
    {
        using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        using var transaction = connection.BeginTransaction();

        var existing = await connection.QuerySingleOrDefaultAsync<WorkslipReportRow>(new CommandDefinition(
            "select * from dbo.WorkslipReports where Id = @Id;",
            new { Id = id },
            transaction,
            cancellationToken: cancellationToken));

        if (existing is null || !WorkslipStatusPolicy.CanEdit(ParseStatus(existing.Status)))
        {
            return null;
        }

        var now = DateTimeOffset.UtcNow;
        await connection.ExecuteAsync(new CommandDefinition(
            """
            update dbo.WorkslipReports
            set ReportNumber = coalesce(@ReportNumber, ReportNumber),
                CustomerName = coalesce(@CustomerName, CustomerName),
                CustomerAddress = coalesce(@CustomerAddress, CustomerAddress),
                ContactPerson = @ContactPerson,
                Phone = @Phone,
                ReportDate = coalesce(@ReportDate, ReportDate),
                TaskDescription = coalesce(@TaskDescription, TaskDescription),
                CustomerObservations = @CustomerObservations,
                InstallationTypesJson = coalesce(@InstallationTypesJson, InstallationTypesJson),
                WorkKind = coalesce(@WorkKind, WorkKind),
                CustomWorkKind = @CustomWorkKind,
                Remarks = @Remarks,
                ClosureFlagsJson = coalesce(@ClosureFlagsJson, ClosureFlagsJson),
                PayloadJson = coalesce(@PayloadJson, PayloadJson),
                UpdatedAt = @UpdatedAt
            where Id = @Id;
            """,
            new
            {
                Id = id,
                request.ReportNumber,
                request.CustomerName,
                request.CustomerAddress,
                request.ContactPerson,
                request.Phone,
                request.ReportDate,
                request.TaskDescription,
                request.CustomerObservations,
                InstallationTypesJson = request.InstallationTypes is null ? null : ToJson(request.InstallationTypes),
                request.WorkKind,
                request.CustomWorkKind,
                request.Remarks,
                ClosureFlagsJson = request.ClosureFlags is null ? null : ToJson(request.ClosureFlags),
                PayloadJson = request.Payload?.ToJsonString(JsonOptions),
                UpdatedAt = now
            },
            transaction,
            cancellationToken: cancellationToken));

        if (request.ControlChecks is not null)
        {
            await connection.ExecuteAsync(new CommandDefinition(
                "delete from dbo.WorkslipControlChecks where ReportId = @Id;",
                new { Id = id },
                transaction,
                cancellationToken: cancellationToken));
            await UpsertControlChecksAsync(connection, transaction, id, request.ControlChecks, now, cancellationToken);
        }

        await InsertEventAsync(connection, transaction, id, null, "updated", ToJsonNode(existing), ToJsonNode(request), now, cancellationToken);
        transaction.Commit();

        return await GetAsync(id, cancellationToken);
    }

    public async Task<WorkslipReportResponse?> TransitionAsync(Guid id, WorkslipStatus nextStatus, Guid? actorId, CancellationToken cancellationToken)
    {
        using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        using var transaction = connection.BeginTransaction();

        var existing = await connection.QuerySingleOrDefaultAsync<WorkslipReportRow>(new CommandDefinition(
            "select * from dbo.WorkslipReports where Id = @Id;",
            new { Id = id },
            transaction,
            cancellationToken: cancellationToken));

        if (existing is null)
        {
            return null;
        }

        var currentStatus = ParseStatus(existing.Status);
        if (!WorkslipStatusPolicy.CanTransition(currentStatus, nextStatus))
        {
            return null;
        }

        var now = DateTimeOffset.UtcNow;
        await connection.ExecuteAsync(new CommandDefinition(
            """
            update dbo.WorkslipReports
            set Status = @Status,
                UpdatedAt = @UpdatedAt,
                SubmittedAt = case when @Status = 'Submitted' then @UpdatedAt else SubmittedAt end
            where Id = @Id;
            """,
            new { Id = id, Status = nextStatus.ToString(), UpdatedAt = now },
            transaction,
            cancellationToken: cancellationToken));

        await InsertEventAsync(connection, transaction, id, actorId, nextStatus.ToString().ToLowerInvariant(), ToJsonNode(existing), ToJsonNode(new { status = nextStatus.ToString() }), now, cancellationToken);
        transaction.Commit();

        return await GetAsync(id, cancellationToken);
    }

    private static async Task UpsertControlChecksAsync(
        IDbConnection connection,
        IDbTransaction transaction,
        Guid reportId,
        IReadOnlyList<ControlCheckRequest> checks,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        foreach (var check in checks)
        {
            await connection.ExecuteAsync(new CommandDefinition(
                """
                insert into dbo.WorkslipControlChecks (Id, ReportId, StageId, ColumnId, ItemId, Checked, Note, CreatedAt, UpdatedAt)
                values (@Id, @ReportId, @StageId, @ColumnId, @ItemId, @Checked, @Note, @CreatedAt, @UpdatedAt);
                """,
                new
                {
                    Id = Guid.NewGuid(),
                    ReportId = reportId,
                    check.StageId,
                    check.ColumnId,
                    check.ItemId,
                    check.Checked,
                    check.Note,
                    CreatedAt = now,
                    UpdatedAt = now
                },
                transaction,
                cancellationToken: cancellationToken));
        }
    }

    private static async Task InsertEventAsync(
        IDbConnection connection,
        IDbTransaction transaction,
        Guid reportId,
        Guid? actorId,
        string eventType,
        JsonObject? before,
        JsonObject? after,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        await connection.ExecuteAsync(new CommandDefinition(
            """
            insert into dbo.WorkslipEvents (Id, ReportId, ActorId, EventType, BeforeJson, AfterJson, CreatedAt)
            values (@Id, @ReportId, @ActorId, @EventType, @BeforeJson, @AfterJson, @CreatedAt);
            """,
            new
            {
                Id = Guid.NewGuid(),
                ReportId = reportId,
                ActorId = actorId,
                EventType = eventType,
                BeforeJson = before?.ToJsonString(JsonOptions),
                AfterJson = after?.ToJsonString(JsonOptions),
                CreatedAt = now
            },
            transaction,
            cancellationToken: cancellationToken));
    }

    private static WorkslipReportResponse ToResponse(WorkslipReportRow row, IEnumerable<WorkslipControlCheckRow> checks) =>
        new(
            row.Id,
            row.OrganizationId,
            row.ReportNumber,
            ParseStatus(row.Status),
            row.CustomerName,
            row.CustomerAddress,
            row.ContactPerson,
            row.Phone,
            ToDateOnly(row.ReportDate),
            row.TaskDescription,
            row.CustomerObservations,
            FromJsonList(row.InstallationTypesJson),
            row.WorkKind,
            row.CustomWorkKind,
            row.Remarks,
            FromJsonList(row.ClosureFlagsJson),
            string.IsNullOrWhiteSpace(row.PayloadJson) ? null : JsonNode.Parse(row.PayloadJson) as JsonObject,
            checks.Select(check => new ControlCheckResponse(
                check.Id,
                check.StageId,
                check.ColumnId,
                check.ItemId,
                check.Checked,
                check.Note,
                check.CreatedAt,
                check.UpdatedAt)).ToArray(),
            row.CreatedAt,
            row.UpdatedAt,
            row.SubmittedAt);

    private static WorkslipStatus ParseStatus(string status) => Enum.Parse<WorkslipStatus>(status, ignoreCase: true);

    private static DateOnly? ToDateOnly(DateTime? value) =>
        value is null ? null : DateOnly.FromDateTime(value.Value);

    private static string ToJson<T>(T value) => JsonSerializer.Serialize(value, JsonOptions);

    private static JsonObject ToJsonNode<T>(T value) =>
        JsonSerializer.SerializeToNode(value, JsonOptions)?.AsObject() ?? [];

    private static IReadOnlyList<string> FromJsonList(string? json) =>
        string.IsNullOrWhiteSpace(json)
            ? []
            : JsonSerializer.Deserialize<IReadOnlyList<string>>(json, JsonOptions) ?? [];

    private sealed class WorkslipReportRow
    {
        public Guid Id { get; init; }
        public Guid OrganizationId { get; init; }
        public string ReportNumber { get; init; } = "";
        public string Status { get; init; } = "";
        public string CustomerName { get; init; } = "";
        public string CustomerAddress { get; init; } = "";
        public string? ContactPerson { get; init; }
        public string? Phone { get; init; }
        public DateTime? ReportDate { get; init; }
        public string TaskDescription { get; init; } = "";
        public string? CustomerObservations { get; init; }
        public string InstallationTypesJson { get; init; } = "[]";
        public string WorkKind { get; init; } = "";
        public string? CustomWorkKind { get; init; }
        public string? Remarks { get; init; }
        public string ClosureFlagsJson { get; init; } = "[]";
        public string? PayloadJson { get; init; }
        public DateTimeOffset CreatedAt { get; init; }
        public DateTimeOffset UpdatedAt { get; init; }
        public DateTimeOffset? SubmittedAt { get; init; }
    }

    private sealed class WorkslipControlCheckRow
    {
        public Guid Id { get; init; }
        public string StageId { get; init; } = "";
        public string ColumnId { get; init; } = "";
        public string ItemId { get; init; } = "";
        public bool Checked { get; init; }
        public string? Note { get; init; }
        public DateTimeOffset CreatedAt { get; init; }
        public DateTimeOffset UpdatedAt { get; init; }
    }
}
