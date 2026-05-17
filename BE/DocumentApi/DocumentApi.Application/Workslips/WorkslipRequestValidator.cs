namespace DocumentApi.Workslips;

public static class WorkslipRequestValidator
{
    public static IReadOnlyList<WorkslipValidationError> ValidateCreate(CreateWorkslipRequest request)
    {
        var errors = new List<WorkslipValidationError>();

        Required(request.ReportNumber, "reportNumber", errors);
        Required(request.CustomerName, "customerName", errors);
        Required(request.CustomerAddress, "customerAddress", errors);
        Required(request.TaskDescription, "taskDescription", errors);

        if (request.InstallationTypes.Count == 0)
        {
            errors.Add(new("installationTypes", "Select at least one installation type."));
        }

        Required(request.WorkKind, "workKind", errors);
        if (string.Equals(request.WorkKind, "serviceAndet", StringComparison.OrdinalIgnoreCase) &&
            string.IsNullOrWhiteSpace(request.CustomWorkKind))
        {
            errors.Add(new("customWorkKind", "Custom work kind is required when work kind is Andet."));
        }

        return errors;
    }

    private static void Required(string? value, string field, List<WorkslipValidationError> errors)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            errors.Add(new(field, $"{field} is required."));
        }
    }
}
