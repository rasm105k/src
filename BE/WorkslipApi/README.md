# Workslip API

.NET API draft for storing, editing and reviewing 4V05 Workslip reports.

## Stack

- ASP.NET Core minimal APIs
- Azure SQL Database
- Dapper
- SQL migrations in `Migrations/`
- Bicep resources in `..\infrastructure\main.bicep`

## Endpoints

- `GET /health`
- `POST /api/workslips`
- `GET /api/workslips`
- `GET /api/workslips/{id}`
- `PATCH /api/workslips/{id}`
- `POST /api/workslips/{id}/submit`
- `POST /api/workslips/{id}/approve`
- `POST /api/workslips/{id}/reject`

## Configuration

Set the Azure SQL connection string using either:

- `ConnectionStrings:WorkslipDb`
- `Sql:ConnectionString`

Example environment variable:

```powershell
$env:ConnectionStrings__WorkslipDb = "Server=tcp:<server>.database.windows.net,1433;Initial Catalog=workslip;User ID=<user>;Password=<password>;Encrypt=True;TrustServerCertificate=False;"
```

Do not commit real connection strings or secrets.

## Migrations

Initial schema is in `Migrations/001_init_workslip.sql`.

The draft includes `SqlMigrationRunner`, but migrations are not automatically executed on startup yet. Keep migration execution explicit until deployment workflow is settled.
