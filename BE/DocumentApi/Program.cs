using DocumentApi.Data;
using DocumentApi.Documents;
using DocumentApi.Migrations;
using DocumentApi.Workslips;

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
