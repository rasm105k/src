using WorkslipApi.Data;
using WorkslipApi.Documents;
using WorkslipApi.Migrations;
using WorkslipApi.Workslips;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddSingleton<ISqlConnectionFactory, SqlConnectionFactory>();
builder.Services.AddScoped<IDocumentRepository, DapperDocumentRepository>();
builder.Services.AddScoped<IWorkslipRepository, DapperWorkslipRepository>();
builder.Services.AddScoped<SqlMigrationRunner>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapDocumentEndpoints();
app.MapWorkslipEndpoints();

app.Run();

public partial class Program;
