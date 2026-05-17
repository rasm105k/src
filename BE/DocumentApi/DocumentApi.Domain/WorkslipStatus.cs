namespace DocumentApi.Domain;

public enum WorkslipStatus
{
    Draft,
    Submitted,
    InReview,
    Approved,
    Rejected,
    Archived
}

public static class WorkslipStatusPolicy
{
    public static bool CanEdit(WorkslipStatus status) =>
        status is WorkslipStatus.Draft or WorkslipStatus.Submitted or WorkslipStatus.InReview or WorkslipStatus.Rejected;

    public static bool CanTransition(WorkslipStatus current, WorkslipStatus next) =>
        (current, next) switch
        {
            (WorkslipStatus.Draft, WorkslipStatus.Submitted) => true,
            (WorkslipStatus.Rejected, WorkslipStatus.Submitted) => true,
            (WorkslipStatus.Submitted, WorkslipStatus.InReview) => true,
            (WorkslipStatus.Submitted, WorkslipStatus.Approved) => true,
            (WorkslipStatus.InReview, WorkslipStatus.Approved) => true,
            (WorkslipStatus.Submitted, WorkslipStatus.Rejected) => true,
            (WorkslipStatus.InReview, WorkslipStatus.Rejected) => true,
            (WorkslipStatus.Approved, WorkslipStatus.Archived) => true,
            _ => false
        };
}
