using DocumentApi.Documents;
using DocumentApi.Infrastructure;
using DocumentApi.Workslips;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddDocumentApiInfrastructure();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapDocumentEndpoints();
app.MapWorkslipEndpoints();

app.Run();

public partial class Program;
