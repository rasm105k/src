using WorkslipApi.Domain;

namespace WorkslipApi.Workslips;

public static class WorkslipEndpoints
{
    public static IEndpointRouteBuilder MapWorkslipEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/workslips").WithTags("Workslips");

        group.MapPost("/", async (
            CreateWorkslipRequest request,
            IWorkslipRepository repository,
            CancellationToken cancellationToken) =>
        {
            var errors = WorkslipRequestValidator.ValidateCreate(request);
            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors
                    .GroupBy(error => error.Field)
                    .ToDictionary(group => group.Key, group => group.Select(error => error.Message).ToArray()));
            }

            var created = await repository.CreateAsync(request, cancellationToken);
            return Results.Created($"/api/workslips/{created.Id}", created);
        });

        group.MapGet("/", async (
            Guid? organizationId,
            WorkslipStatus? status,
            int? limit,
            int? offset,
            IWorkslipRepository repository,
            CancellationToken cancellationToken) =>
        {
            var query = new WorkslipQuery(organizationId, status, Math.Clamp(limit ?? 50, 1, 200), Math.Max(offset ?? 0, 0));
            return Results.Ok(await repository.ListAsync(query, cancellationToken));
        });

        group.MapGet("/{id:guid}", async (Guid id, IWorkslipRepository repository, CancellationToken cancellationToken) =>
        {
            var report = await repository.GetAsync(id, cancellationToken);
            return report is null ? Results.NotFound() : Results.Ok(report);
        });

        group.MapPatch("/{id:guid}", async (
            Guid id,
            UpdateWorkslipRequest request,
            IWorkslipRepository repository,
            CancellationToken cancellationToken) =>
        {
            var updated = await repository.UpdateAsync(id, request, cancellationToken);
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        });

        group.MapPost("/{id:guid}/submit", async (
            Guid id,
            IWorkslipRepository repository,
            CancellationToken cancellationToken) =>
        {
            var report = await repository.TransitionAsync(id, WorkslipStatus.Submitted, actorId: null, cancellationToken);
            return report is null ? Results.NotFound() : Results.Ok(report);
        });

        group.MapPost("/{id:guid}/approve", async (
            Guid id,
            Guid? actorId,
            IWorkslipRepository repository,
            CancellationToken cancellationToken) =>
        {
            var report = await repository.TransitionAsync(id, WorkslipStatus.Approved, actorId, cancellationToken);
            return report is null ? Results.NotFound() : Results.Ok(report);
        });

        group.MapPost("/{id:guid}/reject", async (
            Guid id,
            Guid? actorId,
            IWorkslipRepository repository,
            CancellationToken cancellationToken) =>
        {
            var report = await repository.TransitionAsync(id, WorkslipStatus.Rejected, actorId, cancellationToken);
            return report is null ? Results.NotFound() : Results.Ok(report);
        });

        return app;
    }
}
