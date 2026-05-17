using DocumentApi.Data;
using DocumentApi.Documents;
using DocumentApi.Migrations;
using DocumentApi.Workslips;
using Microsoft.Extensions.DependencyInjection;

namespace DocumentApi.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddDocumentApiInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton<ISqlConnectionFactory, SqlConnectionFactory>();
        services.AddScoped<IDocumentRepository, DapperDocumentRepository>();
        services.AddScoped<IWorkslipRepository, DapperWorkslipRepository>();
        services.AddScoped<SqlMigrationRunner>();

        return services;
    }
}
