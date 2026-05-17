# Workslip API

.NET API for receiving, storing and editing digital reports.

The API now has two tracks:

- legacy/specific 4V05 workslip endpoints under `/api/workslips`
- generic document/report endpoints under `/api/document-types` and `/api/reports`


## Architecture 
- Use onion architecture principles 
- Always adhere to REST-standards in endpoints
- If datamodels changes verify affected endpoints still work

## Stack

- ASP.NET Core minimal APIs
- Azure SQL Database
- Dapper
- SQL migrations in `Migrations/`
- Bicep resources in `..\infrastructure\main.bicep`

## Endpoints

- `GET /health`

### Generic documents

- `POST /api/document-types`
- `GET /api/document-types`
- `POST /api/reports`
- `GET /api/reports`
- `GET /api/reports/{id}`
- `PATCH /api/reports/{id}`
- `POST /api/reports/{id}/files`
- `PUT /api/reports/{id}/fields`

### 4V05 workslips

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

Generic document/report schema is in `Migrations/002_generic_documents.sql`.

The draft includes `SqlMigrationRunner`, but migrations are not automatically executed on startup yet. Keep migration execution explicit until deployment workflow is settled.

## Generic document model

The generic model is intentionally not locked to 4V05:

- `DocumentTypes` describes report/form type and version.
- `DocumentTypeFields` describes expected fields for a type.
- `Reports` stores report metadata, status, review status and scores.
- `DocumentFiles` links reports to Azure Blob files by storage account, container, blob name and optional blob version.
- `ReportFields` stores dynamic extracted/corrected fields with confidence, status and source.
- `ProcessingRuns`, `ReviewIssues`, `Approvals` and `AuditEvents` support OCR/AI processing, human review and auditability.
