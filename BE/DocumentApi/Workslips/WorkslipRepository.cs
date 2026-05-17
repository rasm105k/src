using DocumentApi.Domain;

namespace DocumentApi.Workslips;

public sealed record WorkslipQuery(Guid? OrganizationId, WorkslipStatus? Status, int Limit, int Offset);

public interface IWorkslipRepository
{
    Task<WorkslipReportResponse> CreateAsync(CreateWorkslipRequest request, CancellationToken cancellationToken);
    Task<IReadOnlyList<WorkslipListItemResponse>> ListAsync(WorkslipQuery query, CancellationToken cancellationToken);
    Task<WorkslipReportResponse?> GetAsync(Guid id, CancellationToken cancellationToken);
    Task<WorkslipReportResponse?> UpdateAsync(Guid id, UpdateWorkslipRequest request, CancellationToken cancellationToken);
    Task<WorkslipReportResponse?> TransitionAsync(Guid id, WorkslipStatus nextStatus, Guid? actorId, CancellationToken cancellationToken);
}
