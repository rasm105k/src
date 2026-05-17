set ansi_nulls on;
set quoted_identifier on;
set nocount on;

declare @orgId uniqueidentifier = '11111111-1111-1111-1111-111111111111';
declare @adminUserId uniqueidentifier = '22222222-2222-2222-2222-222222222222';
declare @techUserId uniqueidentifier = '33333333-3333-3333-3333-333333333333';
declare @customerId uniqueidentifier = '44444444-4444-4444-4444-444444444444';
declare @siteId uniqueidentifier = '55555555-5555-5555-5555-555555555555';
declare @caseId uniqueidentifier = '66666666-6666-6666-6666-666666666666';

declare @workslipTypeId uniqueidentifier = '70000000-0000-0000-0000-000000000001';
declare @deviationTypeId uniqueidentifier = '70000000-0000-0000-0000-000000000002';

declare @reportId uniqueidentifier = '80000000-0000-0000-0000-000000000001';
declare @deviationReportId uniqueidentifier = '80000000-0000-0000-0000-000000000002';
declare @originalFileId uniqueidentifier = '90000000-0000-0000-0000-000000000001';
declare @ocrFileId uniqueidentifier = '90000000-0000-0000-0000-000000000002';
declare @aiFileId uniqueidentifier = '90000000-0000-0000-0000-000000000003';
declare @generatedPdfFileId uniqueidentifier = '90000000-0000-0000-0000-000000000004';
declare @deviationOriginalFileId uniqueidentifier = '90000000-0000-0000-0000-000000000005';

declare @customerNameFieldId uniqueidentifier = 'a0000000-0000-0000-0000-000000000001';
declare @descriptionFieldId uniqueidentifier = 'a0000000-0000-0000-0000-000000000002';
declare @signatureDateFieldId uniqueidentifier = 'a0000000-0000-0000-0000-000000000003';

declare @legacyReportId uniqueidentifier = 'b0000000-0000-0000-0000-000000000001';

if not exists (select 1 from dbo.Organizations where Id = @orgId)
    insert into dbo.Organizations (Id, Name)
    values (@orgId, N'QRapport Demo VVS ApS');

if not exists (select 1 from dbo.Users where Id = @adminUserId)
    insert into dbo.Users (Id, OrganizationId, DisplayName, Email, Role)
    values (@adminUserId, @orgId, N'Rasmus Bak Jakobsen', N'rasmus@example.test', N'Admin');

if not exists (select 1 from dbo.Users where Id = @techUserId)
    insert into dbo.Users (Id, OrganizationId, DisplayName, Email, Role)
    values (@techUserId, @orgId, N'Thomas Mikkelsen', N'thomas@example.test', N'Montør');

if not exists (select 1 from dbo.Customers where Id = @customerId)
    insert into dbo.Customers (Id, OrganizationId, Name, Address, ContactPerson, Phone)
    values (@customerId, @orgId, N'Boligforeningen Ringgården', N'Ringgade 45, 8000 Aarhus C', N'Peter Mortensen', N'22 14 88 32');

if not exists (select 1 from dbo.Sites where Id = @siteId)
    insert into dbo.Sites (Id, OrganizationId, CustomerId, Name, Address)
    values (@siteId, @orgId, @customerId, N'Køkkeninstallation, opgang B', N'Ringgade 45, 2. tv., 8000 Aarhus C');

if not exists (select 1 from dbo.Cases where Id = @caseId)
    insert into dbo.Cases (Id, OrganizationId, CustomerId, SiteId, CaseNumber, Title, Description, Status)
    values (@caseId, @orgId, @customerId, @siteId, N'SAG-2026-001', N'Vand under køkkenvask', N'Scannet arbejdsrapport fra papirflow.', N'Open');

if not exists (select 1 from dbo.DocumentTypes where Id = @workslipTypeId)
    insert into dbo.DocumentTypes (Id, Code, Name, Version, SchemaJson, IsActive)
    values (
        @workslipTypeId,
        N'4V05_WORKSLIP',
        N'4V05-lignende arbejdsrapport',
        1,
        N'{"description":"Demo schema for scannet 4V05-lignende arbejdsrapport"}',
        1
    );

if not exists (select 1 from dbo.DocumentTypes where Id = @deviationTypeId)
    insert into dbo.DocumentTypes (Id, Code, Name, Version, SchemaJson, IsActive)
    values (
        @deviationTypeId,
        N'AFVIGELSE',
        N'Afvigelsesrapport',
        1,
        N'{"description":"Demo schema for afvigelser og korrigerende handlinger"}',
        1
    );

if not exists (select 1 from dbo.DocumentTypeFields where DocumentTypeId = @workslipTypeId and FieldKey = N'customer.name')
    insert into dbo.DocumentTypeFields (Id, DocumentTypeId, FieldKey, Label, DataType, IsRequired, SortOrder)
    values (newid(), @workslipTypeId, N'customer.name', N'Kunde', N'Text', 1, 10);

if not exists (select 1 from dbo.DocumentTypeFields where DocumentTypeId = @workslipTypeId and FieldKey = N'site.address')
    insert into dbo.DocumentTypeFields (Id, DocumentTypeId, FieldKey, Label, DataType, IsRequired, SortOrder)
    values (newid(), @workslipTypeId, N'site.address', N'Installationsadresse', N'Text', 1, 20);

if not exists (select 1 from dbo.DocumentTypeFields where DocumentTypeId = @workslipTypeId and FieldKey = N'task.description')
    insert into dbo.DocumentTypeFields (Id, DocumentTypeId, FieldKey, Label, DataType, IsRequired, SortOrder)
    values (newid(), @workslipTypeId, N'task.description', N'Opgavebeskrivelse', N'Text', 1, 30);

if not exists (select 1 from dbo.DocumentTypeFields where DocumentTypeId = @workslipTypeId and FieldKey = N'signature.date')
    insert into dbo.DocumentTypeFields (Id, DocumentTypeId, FieldKey, Label, DataType, IsRequired, SortOrder)
    values (newid(), @workslipTypeId, N'signature.date', N'Underskriftsdato', N'Date', 1, 40);

if not exists (select 1 from dbo.DocumentTypeFields where DocumentTypeId = @deviationTypeId and FieldKey = N'deviation.description')
    insert into dbo.DocumentTypeFields (Id, DocumentTypeId, FieldKey, Label, DataType, IsRequired, SortOrder)
    values (newid(), @deviationTypeId, N'deviation.description', N'Afvigelse', N'Text', 1, 10);

if not exists (select 1 from dbo.DocumentTypeFields where DocumentTypeId = @deviationTypeId and FieldKey = N'corrective.action')
    insert into dbo.DocumentTypeFields (Id, DocumentTypeId, FieldKey, Label, DataType, IsRequired, SortOrder)
    values (newid(), @deviationTypeId, N'corrective.action', N'Korrigerende handling', N'Text', 1, 20);

if not exists (select 1 from dbo.Reports where Id = @reportId)
    insert into dbo.Reports (
        Id, OrganizationId, DocumentTypeId, CustomerId, SiteId, CaseId, ReportNumber, Title, Status, ReviewStatus,
        ReviewScore, PayloadJson, CreatedAt, UpdatedAt, SubmittedAt
    )
    values (
        @reportId, @orgId, @workslipTypeId, @customerId, @siteId, @caseId, N'4V05-DEMO-001', N'Scannet arbejdsrapport',
        N'InReview', N'NeedsReview', 82.50,
        N'{"source":"seed","demo":true,"installationTypes":["vand","aflob"]}',
        sysutcdatetime(), sysutcdatetime(), sysutcdatetime()
    );

if not exists (select 1 from dbo.Reports where Id = @deviationReportId)
    insert into dbo.Reports (
        Id, OrganizationId, DocumentTypeId, CustomerId, SiteId, CaseId, ReportNumber, Title, Status, ReviewStatus,
        ReviewScore, PayloadJson, CreatedAt, UpdatedAt, SubmittedAt
    )
    values (
        @deviationReportId, @orgId, @deviationTypeId, @customerId, @siteId, @caseId, N'AFV-DEMO-001', N'Afvigelse på scannet rapport',
        N'Approved', N'Approved', 96.00,
        N'{"source":"seed","demo":true}',
        sysutcdatetime(), sysutcdatetime(), sysutcdatetime()
    );

if not exists (select 1 from dbo.DocumentFiles where Id = @originalFileId)
    insert into dbo.DocumentFiles (
        Id, OrganizationId, ReportId, Purpose, StorageAccountName, ContainerName, BlobName, BlobVersionId,
        FileName, ContentType, FileSizeBytes, Sha256Hash, CreatedAt, CreatedByUserId
    )
    values (
        @originalFileId, @orgId, @reportId, N'OriginalUpload', N'stqrapportdev', N'uploads',
        N'2026/05/16/4v05-demo-001.pdf', N'2026-05-16T12:00:00.0000000Z',
        N'4v05-demo-001.pdf', N'application/pdf', 348102, N'demo-original-sha256', sysutcdatetime(), @adminUserId
    );

if not exists (select 1 from dbo.DocumentFiles where Id = @ocrFileId)
    insert into dbo.DocumentFiles (
        Id, OrganizationId, ReportId, Purpose, StorageAccountName, ContainerName, BlobName, BlobVersionId,
        FileName, ContentType, FileSizeBytes, Sha256Hash, CreatedAt, CreatedByUserId
    )
    values (
        @ocrFileId, @orgId, @reportId, N'OcrJson', N'stqrapportdev', N'documents',
        N'2026/05/16/4v05-demo-001.ocr.json', null,
        N'4v05-demo-001.ocr.json', N'application/json', 18422, N'demo-ocr-sha256', sysutcdatetime(), @adminUserId
    );

if not exists (select 1 from dbo.DocumentFiles where Id = @aiFileId)
    insert into dbo.DocumentFiles (
        Id, OrganizationId, ReportId, Purpose, StorageAccountName, ContainerName, BlobName, BlobVersionId,
        FileName, ContentType, FileSizeBytes, Sha256Hash, CreatedAt, CreatedByUserId
    )
    values (
        @aiFileId, @orgId, @reportId, N'AiJson', N'stqrapportdev', N'documents',
        N'2026/05/16/4v05-demo-001.ai.json', null,
        N'4v05-demo-001.ai.json', N'application/json', 9211, N'demo-ai-sha256', sysutcdatetime(), @adminUserId
    );

if not exists (select 1 from dbo.DocumentFiles where Id = @generatedPdfFileId)
    insert into dbo.DocumentFiles (
        Id, OrganizationId, ReportId, Purpose, StorageAccountName, ContainerName, BlobName, BlobVersionId,
        FileName, ContentType, FileSizeBytes, Sha256Hash, CreatedAt, CreatedByUserId
    )
    values (
        @generatedPdfFileId, @orgId, @reportId, N'GeneratedPdf', N'stqrapportdev', N'documents',
        N'2026/05/16/4v05-demo-001.audit.pdf', null,
        N'4v05-demo-001.audit.pdf', N'application/pdf', 212000, N'demo-pdf-sha256', sysutcdatetime(), @adminUserId
    );

if not exists (select 1 from dbo.DocumentFiles where Id = @deviationOriginalFileId)
    insert into dbo.DocumentFiles (
        Id, OrganizationId, ReportId, Purpose, StorageAccountName, ContainerName, BlobName, BlobVersionId,
        FileName, ContentType, FileSizeBytes, Sha256Hash, CreatedAt, CreatedByUserId
    )
    values (
        @deviationOriginalFileId, @orgId, @deviationReportId, N'OriginalUpload', N'stqrapportdev', N'uploads',
        N'2026/05/16/afv-demo-001.pdf', null,
        N'afv-demo-001.pdf', N'application/pdf', 151000, N'demo-afv-original-sha256', sysutcdatetime(), @adminUserId
    );

update dbo.Reports
set OriginalFileId = @originalFileId,
    GeneratedPdfFileId = @generatedPdfFileId,
    UpdatedAt = sysutcdatetime()
where Id = @reportId;

update dbo.Reports
set OriginalFileId = @deviationOriginalFileId,
    ApprovedAt = coalesce(ApprovedAt, sysutcdatetime()),
    ApprovedByUserId = @adminUserId,
    UpdatedAt = sysutcdatetime()
where Id = @deviationReportId;

if not exists (select 1 from dbo.ProcessingRuns where Id = 'c0000000-0000-0000-0000-000000000001')
    insert into dbo.ProcessingRuns (
        Id, ReportId, RunType, Status, ModelProvider, ModelName, ModelVersion, InputFileId, OutputFileId,
        StartedAt, CompletedAt, OutputJson
    )
    values (
        'c0000000-0000-0000-0000-000000000001', @reportId, N'OCR', N'Succeeded', N'Azure Document Intelligence',
        N'sexymodel', N'2024-11-30', @originalFileId, @ocrFileId, dateadd(minute, -10, sysutcdatetime()), dateadd(minute, -9, sysutcdatetime()),
        N'{"pages":1,"status":"succeeded"}'
    );

if not exists (select 1 from dbo.ProcessingRuns where Id = 'c0000000-0000-0000-0000-000000000002')
    insert into dbo.ProcessingRuns (
        Id, ReportId, RunType, Status, ModelProvider, ModelName, ModelVersion, InputFileId, OutputFileId,
        StartedAt, CompletedAt, OutputJson
    )
    values (
        'c0000000-0000-0000-0000-000000000002', @reportId, N'AIExtraction', N'Succeeded', N'Azure OpenAI',
        N'gpt-demo', N'1', @ocrFileId, @aiFileId, dateadd(minute, -8, sysutcdatetime()), dateadd(minute, -7, sysutcdatetime()),
        N'{"reviewScore":82.5,"uncertainFields":1}'
    );

if not exists (select 1 from dbo.ReportFields where Id = @customerNameFieldId)
    insert into dbo.ReportFields (
        Id, ReportId, FieldKey, InstanceIndex, Label, DataType, RawValueText, NormalizedValueText, Confidence,
        Status, Source, BoundingRegionsJson, CreatedAt, UpdatedAt
    )
    values (
        @customerNameFieldId, @reportId, N'customer.name', 0, N'Kunde', N'Text', N'Boligforeningen Ringgården',
        N'Boligforeningen Ringgården', 97.00, N'Confirmed', N'AI', N'{"page":1,"polygon":[10,10,120,10,120,30,10,30]}',
        sysutcdatetime(), sysutcdatetime()
    );

if not exists (select 1 from dbo.ReportFields where Id = @descriptionFieldId)
    insert into dbo.ReportFields (
        Id, ReportId, FieldKey, InstanceIndex, Label, DataType, RawValueText, NormalizedValueText, Confidence,
        Status, Source, BoundingRegionsJson, CreatedAt, UpdatedAt
    )
    values (
        @descriptionFieldId, @reportId, N'task.description', 0, N'Opgavebeskrivelse', N'Text',
        N'Vand under køkkenvask - udskiftning af vandlås og tæthedsprøvning',
        N'Vand under køkkenvask. Udskiftning af vandlås og tæthedsprøvning.', 84.00, N'NeedsReview', N'AI',
        N'{"page":1,"polygon":[10,80,280,80,280,125,10,125]}', sysutcdatetime(), sysutcdatetime()
    );

if not exists (select 1 from dbo.ReportFields where Id = @signatureDateFieldId)
    insert into dbo.ReportFields (
        Id, ReportId, FieldKey, InstanceIndex, Label, DataType, RawValueText, NormalizedValueText, Confidence,
        Status, Source, BoundingRegionsJson, CreatedAt, UpdatedAt
    )
    values (
        @signatureDateFieldId, @reportId, N'signature.date', 0, N'Underskriftsdato', N'Date',
        N'16/5-26', N'2026-05-16', 71.00, N'NeedsReview', N'OCR',
        N'{"page":1,"polygon":[330,690,420,690,420,720,330,720]}', sysutcdatetime(), sysutcdatetime()
    );

if not exists (select 1 from dbo.ReviewIssues where Id = 'd0000000-0000-0000-0000-000000000001')
    insert into dbo.ReviewIssues (Id, ReportId, FieldId, Severity, IssueType, Message, Status, CreatedAt)
    values (
        'd0000000-0000-0000-0000-000000000001', @reportId, @signatureDateFieldId, N'Medium', N'LowConfidence',
        N'Underskriftsdato er læst med lav sikkerhed og bør kontrolleres mod originalen.', N'Open', sysutcdatetime()
    );

if not exists (select 1 from dbo.Approvals where Id = 'e0000000-0000-0000-0000-000000000001')
    insert into dbo.Approvals (Id, ReportId, ApprovedByUserId, Role, Decision, Comment, SnapshotJson, CreatedAt)
    values (
        'e0000000-0000-0000-0000-000000000001', @deviationReportId, @adminUserId, N'Admin', N'Approved',
        N'Demoafvigelse godkendt efter manuel kontrol.', N'{"reportId":"80000000-0000-0000-0000-000000000002","status":"Approved"}',
        sysutcdatetime()
    );

if not exists (select 1 from dbo.AuditEvents where Id = 'f0000000-0000-0000-0000-000000000001')
    insert into dbo.AuditEvents (Id, OrganizationId, ReportId, FileId, ActorId, EventType, EntityType, AfterJson, CorrelationId, CreatedAt)
    values (
        'f0000000-0000-0000-0000-000000000001', @orgId, @reportId, @originalFileId, @adminUserId,
        N'file_uploaded', N'DocumentFile', N'{"purpose":"OriginalUpload"}', N'demo-correlation-001', sysutcdatetime()
    );

if not exists (select 1 from dbo.AuditEvents where Id = 'f0000000-0000-0000-0000-000000000002')
    insert into dbo.AuditEvents (Id, OrganizationId, ReportId, FileId, ActorId, EventType, EntityType, AfterJson, CorrelationId, CreatedAt)
    values (
        'f0000000-0000-0000-0000-000000000002', @orgId, @reportId, null, @adminUserId,
        N'report_created', N'Report', N'{"reviewStatus":"NeedsReview"}', N'demo-correlation-001', sysutcdatetime()
    );

if not exists (select 1 from dbo.WorkslipReports where Id = @legacyReportId)
    insert into dbo.WorkslipReports (
        Id, OrganizationId, ReportNumber, Status, CustomerName, CustomerAddress, ContactPerson, Phone, ReportDate,
        TaskDescription, CustomerObservations, InstallationTypesJson, WorkKind, CustomWorkKind, Remarks, ClosureFlagsJson,
        PayloadJson, CreatedAt, UpdatedAt, SubmittedAt
    )
    values (
        @legacyReportId, @orgId, N'4V05-LEGACY-001', N'Submitted', N'Boligforeningen Ringgården',
        N'Ringgade 45, 8000 Aarhus C', N'Peter Mortensen', N'22 14 88 32', cast(sysutcdatetime() as date),
        N'Legacy 4V05 testdata', N'Kunden informeret om opfølgning.', N'["vand","aflob"]',
        N'reparation', null, N'Ingen bemærkninger.', N'["faerdig","klarTilFaktura"]',
        N'{"source":"seed","legacy":true}', sysutcdatetime(), sysutcdatetime(), sysutcdatetime()
    );

if not exists (select 1 from dbo.WorkslipControlChecks where ReportId = @legacyReportId and StageId = N'slutkontrol' and ColumnId = N'vand' and ItemId = N'vand-trykproevning')
    insert into dbo.WorkslipControlChecks (Id, ReportId, StageId, ColumnId, ItemId, Checked, Note, CreatedAt, UpdatedAt)
    values (newid(), @legacyReportId, N'slutkontrol', N'vand', N'vand-trykproevning', 1, N'Trykprøvning OK.', sysutcdatetime(), sysutcdatetime());

if not exists (select 1 from dbo.WorkslipEvents where Id = 'f1000000-0000-0000-0000-000000000001')
    insert into dbo.WorkslipEvents (Id, ReportId, ActorId, EventType, BeforeJson, AfterJson, CreatedAt)
    values ('f1000000-0000-0000-0000-000000000001', @legacyReportId, @adminUserId, N'seeded', null, N'{"source":"seed"}', sysutcdatetime());

select N'Seed complete' as Result;
