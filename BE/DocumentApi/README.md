# Workslip API

.NET API for receiving, storing and editing digital reports.

The API now has two tracks:

- legacy/specific 4V05 workslip endpoints under `/api/workslips`
- generic document/report endpoints under `/api/document-types` and `/api/reports`


## Architecture 
- Use onion architecture principles 
- Always adhere to REST-standards in endpoints
- If datamodels changes verify affected endpoints still work

The API is split into onion-style projects:

- `DocumentApi.Domain` contains domain constants and policy types.
- `DocumentApi.Application` contains contracts, validation, repository interfaces and frontend view-model mapping.
- `DocumentApi.Infrastructure` contains SQL connection handling, Dapper repositories and migration execution.
- `WorkslipApi.csproj` is the API/presentation composition root with minimal API endpoints.

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
- `POST /api/document-types/{id}/fields`
- `PATCH /api/document-types/{id}/fields/{fieldKey}`
- `DELETE /api/document-types/{id}/fields/{fieldKey}`
- `GET /api/document-types/{id}/view-model`
- `POST /api/reports`
- `GET /api/reports`
- `GET /api/reports/{id}`
- `GET /api/reports/{id}/view-model`
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

- `ConnectionStrings:Workslip`
- `Sql:ConnectionString`

For local development, `appsettings.Development.json` points to LocalDB:

```text
Server=(localdb)\MSSQLLocalDB;Database=Workslip;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True
```

Example environment variable:

```powershell
$env:ConnectionStrings__Workslip = "Server=tcp:<server>.database.windows.net,1433;Initial Catalog=workslip;User ID=<user>;Password=<password>;Encrypt=True;TrustServerCertificate=False;"
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

## Frontend view models

Frontend apps should prefer the view-model endpoints when rendering dynamic reports:

- `GET /api/document-types/{id}/view-model` returns a template-only view model from `DocumentTypes` and `DocumentTypeFields`.
- `GET /api/reports/{id}/view-model` returns the same section/field shape with report values from `ReportFields` and file references from `DocumentFiles`.

The response is intentionally frontend-oriented:

- `sections` groups fields by `DocumentTypes.SchemaJson.sections` when present.
- If no schema sections exist, fields are grouped by field-key prefix such as `customer`, `site`, `task`, `performed` or `audit`.
- `fields` includes metadata (`key`, `label`, `fieldType`, `required`, `order`, `options`) and data (`value`, `confidence`, `status`, `source`, `boundingRegions`).
- Missing required report fields are returned with `status = "Missing"` so the frontend can render them without hardcoding report-specific fields.
- Unknown extracted fields that are not part of the template are returned in an `extra` section.

## Document type field management

Document templates can be changed through the API without frontend code changes:

- `POST /api/document-types/{id}/fields` adds a field to a document type.
- `PATCH /api/document-types/{id}/fields/{fieldKey}` updates label, type, required flag, sort order or options.
- `DELETE /api/document-types/{id}/fields/{fieldKey}` removes a field from the template.

Existing report field values are not deleted when a template field is removed. They can still appear in the report view model under the `extra` section if extracted data exists for that field key.
