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
declare @workOrderTypeId uniqueidentifier = '70000000-0000-0000-0000-000000000003';
declare @yellowNoteTypeId uniqueidentifier = '70000000-0000-0000-0000-000000000004';
declare @floorHeatingBalancingTypeId uniqueidentifier = '70000000-0000-0000-0000-000000000005';
declare @operationMaintenanceTypeId uniqueidentifier = '70000000-0000-0000-0000-000000000006';
declare @klsAuditReportTypeId uniqueidentifier = '70000000-0000-0000-0000-000000000007';
declare @productGuideTypeId uniqueidentifier = '70000000-0000-0000-0000-000000000008';

declare @reportId uniqueidentifier = '80000000-0000-0000-0000-000000000001';
declare @deviationReportId uniqueidentifier = '80000000-0000-0000-0000-000000000002';
declare @workOrderReportId uniqueidentifier = '80000000-0000-0000-0000-000000000003';
declare @yellowNoteReportId uniqueidentifier = '80000000-0000-0000-0000-000000000004';
declare @floorHeatingBalancingReportId uniqueidentifier = '80000000-0000-0000-0000-000000000005';
declare @operationMaintenanceReportId uniqueidentifier = '80000000-0000-0000-0000-000000000006';
declare @klsAuditReportId uniqueidentifier = '80000000-0000-0000-0000-000000000007';
declare @productGuideReportId uniqueidentifier = '80000000-0000-0000-0000-000000000008';
declare @originalFileId uniqueidentifier = '90000000-0000-0000-0000-000000000001';
declare @ocrFileId uniqueidentifier = '90000000-0000-0000-0000-000000000002';
declare @aiFileId uniqueidentifier = '90000000-0000-0000-0000-000000000003';
declare @generatedPdfFileId uniqueidentifier = '90000000-0000-0000-0000-000000000004';
declare @deviationOriginalFileId uniqueidentifier = '90000000-0000-0000-0000-000000000005';
declare @workOrderOriginalFileId uniqueidentifier = '90000000-0000-0000-0000-000000000006';
declare @yellowNoteOriginalFileId uniqueidentifier = '90000000-0000-0000-0000-000000000007';
declare @floorHeatingBalancingOriginalFileId uniqueidentifier = '90000000-0000-0000-0000-000000000008';
declare @operationMaintenanceOriginalFileId uniqueidentifier = '90000000-0000-0000-0000-000000000009';
declare @klsAuditOriginalFileId uniqueidentifier = '90000000-0000-0000-0000-000000000010';
declare @productGuideOriginalFileId uniqueidentifier = '90000000-0000-0000-0000-000000000011';

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

if not exists (select 1 from dbo.DocumentTypes where Id = @workOrderTypeId)
    insert into dbo.DocumentTypes (Id, Code, Name, Version, SchemaJson, IsActive)
    values (
        @workOrderTypeId,
        N'ARBEJDSSEDDEL',
        N'Almindelig arbejdsseddel',
        1,
        N'{"description":"Scannet eller fotograferet arbejdsseddel med kunde, adresse, opgave, timer/materialer og underskrift","sourceExamples":["Docs/50 - Docs/arbejdssedler_udfyldt-1.pdf"],"category":"CustomerFilledForm"}',
        1
    );

if not exists (select 1 from dbo.DocumentTypes where Id = @yellowNoteTypeId)
    insert into dbo.DocumentTypes (Id, Code, Name, Version, SchemaJson, IsActive)
    values (
        @yellowNoteTypeId,
        N'GUL_SEDDEL',
        N'Håndskrevet gul seddel',
        1,
        N'{"description":"Håndskrevet løs sags-, tilbuds- eller fakturanote, hvor mange felter typisk har lav OCR-sikkerhed","sourceExamples":["Docs/50 - Docs/gul_seddel.jpg"],"category":"CustomerFilledNote"}',
        1
    );

if not exists (select 1 from dbo.DocumentTypes where Id = @floorHeatingBalancingTypeId)
    insert into dbo.DocumentTypes (Id, Code, Name, Version, SchemaJson, IsActive)
    values (
        @floorHeatingBalancingTypeId,
        N'GULVVARME_INDREGULERING',
        N'Gulvvarme indregulering',
        1,
        N'{"description":"Wavin-lignende indreguleringsskema for gulvvarme med kredstabel, afkrydsninger, fremløbstemperatur, bemærkninger og udførende","sourceExamples":["Docs/50 - Docs/Indregulering.pdf"],"category":"CustomerFilledForm"}',
        1
    );

if not exists (select 1 from dbo.DocumentTypes where Id = @operationMaintenanceTypeId)
    insert into dbo.DocumentTypes (Id, Code, Name, Version, SchemaJson, IsActive)
    values (
        @operationMaintenanceTypeId,
        N'DRIFT_VEDLIGEHOLD',
        N'Drift- og vedligeholdelsesdokumentation',
        1,
        N'{"description":"Drift- og vedligeholdelsesmappe med adresseliste, leverandører, komponenter og kontrol-/vedligeholdelsesplan","sourceExamples":["Docs/50 - Docs/Drift og vedligehold standard N.P VVS Teknik.pdf"],"category":"KlsDocumentation"}',
        1
    );

if not exists (select 1 from dbo.DocumentTypes where Id = @klsAuditReportTypeId)
    insert into dbo.DocumentTypes (Id, Code, Name, Version, SchemaJson, IsActive)
    values (
        @klsAuditReportTypeId,
        N'KLS_EFTERPROEVNING',
        N'KLS efterprøvningsrapport',
        1,
        N'{"description":"Efterprøvningsrapport fra KLS-auditør med virksomhedsoplysninger, auditoplysninger, checklistestatus, konklusion og eventuelle afvigelser","sourceExamples":["Docs/50 - Docs/Efterprøvningsrapport.pdf"],"category":"AuditDocumentation"}',
        1
    );

if not exists (select 1 from dbo.DocumentTypes where Id = @productGuideTypeId)
    insert into dbo.DocumentTypes (Id, Code, Name, Version, SchemaJson, IsActive)
    values (
        @productGuideTypeId,
        N'PRODUKT_VEJLEDNING',
        N'Produkt- og indreguleringsvejledning',
        1,
        N'{"description":"Leverandørvejledning eller referencebilag, som gemmes søgbart og kan knyttes til en sag eller rapport","sourceExamples":["Docs/50 - Docs/Tempower_Indreguleringsskemaer_Web_2.pdf"],"category":"ReferenceAttachment"}',
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

insert into dbo.DocumentTypeFields (Id, DocumentTypeId, FieldKey, Label, DataType, IsRequired, SortOrder, OptionsJson)
select newid(), v.DocumentTypeId, v.FieldKey, v.Label, v.DataType, v.IsRequired, v.SortOrder, v.OptionsJson
from (values
    (@workOrderTypeId, N'issuer.name', N'Udsteder/firma', N'Text', cast(0 as bit), 10, cast(null as nvarchar(max))),
    (@workOrderTypeId, N'customer.name', N'Kunde', N'Text', cast(1 as bit), 20, cast(null as nvarchar(max))),
    (@workOrderTypeId, N'site.address', N'Arbejdsadresse', N'Text', cast(1 as bit), 30, cast(null as nvarchar(max))),
    (@workOrderTypeId, N'task.description', N'Opgavebeskrivelse', N'Text', cast(1 as bit), 40, cast(null as nvarchar(max))),
    (@workOrderTypeId, N'work.lines', N'Timer/materialer', N'Json', cast(0 as bit), 50, cast(null as nvarchar(max))),
    (@workOrderTypeId, N'performed.date', N'Dato', N'Date', cast(1 as bit), 60, cast(null as nvarchar(max))),
    (@workOrderTypeId, N'technician.signature', N'Underskrift', N'Text', cast(0 as bit), 70, cast(null as nvarchar(max))),

    (@yellowNoteTypeId, N'customer.name', N'Kunde', N'Text', cast(0 as bit), 10, cast(null as nvarchar(max))),
    (@yellowNoteTypeId, N'note.subject', N'Emne', N'Text', cast(1 as bit), 20, cast(null as nvarchar(max))),
    (@yellowNoteTypeId, N'task.description', N'Notat/opgave', N'Text', cast(1 as bit), 30, cast(null as nvarchar(max))),
    (@yellowNoteTypeId, N'amount.estimated', N'Estimeret beløb', N'Number', cast(0 as bit), 40, cast(null as nvarchar(max))),
    (@yellowNoteTypeId, N'labor.hours', N'Timer', N'Number', cast(0 as bit), 50, cast(null as nvarchar(max))),
    (@yellowNoteTypeId, N'labor.rate', N'Timesats', N'Number', cast(0 as bit), 60, cast(null as nvarchar(max))),
    (@yellowNoteTypeId, N'next.action', N'Næste handling', N'Text', cast(0 as bit), 70, cast(null as nvarchar(max))),

    (@floorHeatingBalancingTypeId, N'supplier.name', N'Leverandør/system', N'Text', cast(0 as bit), 10, cast(null as nvarchar(max))),
    (@floorHeatingBalancingTypeId, N'customer.name', N'Kunde/projekt', N'Text', cast(1 as bit), 20, cast(null as nvarchar(max))),
    (@floorHeatingBalancingTypeId, N'room.name', N'Rum/område', N'Text', cast(1 as bit), 30, cast(null as nvarchar(max))),
    (@floorHeatingBalancingTypeId, N'circuit.rows', N'Kredse og indstillinger', N'Json', cast(1 as bit), 40, cast(null as nvarchar(max))),
    (@floorHeatingBalancingTypeId, N'flow.temperature.c', N'Fremløbstemperatur C', N'Number', cast(0 as bit), 50, cast(null as nvarchar(max))),
    (@floorHeatingBalancingTypeId, N'remarks', N'Bemærkninger', N'Text', cast(0 as bit), 60, cast(null as nvarchar(max))),
    (@floorHeatingBalancingTypeId, N'performed.by', N'Udførende', N'Text', cast(1 as bit), 70, cast(null as nvarchar(max))),
    (@floorHeatingBalancingTypeId, N'performed.date', N'Dato', N'Date', cast(1 as bit), 80, cast(null as nvarchar(max))),

    (@operationMaintenanceTypeId, N'company.name', N'Virksomhed', N'Text', cast(1 as bit), 10, cast(null as nvarchar(max))),
    (@operationMaintenanceTypeId, N'company.cvr', N'CVR', N'Text', cast(0 as bit), 20, cast(null as nvarchar(max))),
    (@operationMaintenanceTypeId, N'company.address', N'Adresse', N'Text', cast(0 as bit), 30, cast(null as nvarchar(max))),
    (@operationMaintenanceTypeId, N'supplier.contacts', N'Leverandørkontakter', N'Json', cast(0 as bit), 40, cast(null as nvarchar(max))),
    (@operationMaintenanceTypeId, N'maintenance.plan', N'Kontrol- og vedligeholdelsesplan', N'Json', cast(1 as bit), 50, cast(null as nvarchar(max))),
    (@operationMaintenanceTypeId, N'instructions.summary', N'Vejledningsoversigt', N'Text', cast(0 as bit), 60, cast(null as nvarchar(max))),

    (@klsAuditReportTypeId, N'audit.date', N'Auditdato', N'Date', cast(1 as bit), 10, cast(null as nvarchar(max))),
    (@klsAuditReportTypeId, N'audit.lead_auditor', N'Lead auditor', N'Text', cast(1 as bit), 20, cast(null as nvarchar(max))),
    (@klsAuditReportTypeId, N'audit.type', N'Audittype', N'Text', cast(1 as bit), 30, cast(null as nvarchar(max))),
    (@klsAuditReportTypeId, N'company.name', N'Virksomhed', N'Text', cast(1 as bit), 40, cast(null as nvarchar(max))),
    (@klsAuditReportTypeId, N'company.cvr', N'CVR', N'Text', cast(1 as bit), 50, cast(null as nvarchar(max))),
    (@klsAuditReportTypeId, N'authorization.number', N'Autorisationsnummer', N'Text', cast(0 as bit), 60, cast(null as nvarchar(max))),
    (@klsAuditReportTypeId, N'conclusion', N'Konklusion', N'Text', cast(1 as bit), 70, cast(null as nvarchar(max))),
    (@klsAuditReportTypeId, N'checklist.results', N'Checklistestatus', N'Json', cast(0 as bit), 80, cast(null as nvarchar(max))),
    (@klsAuditReportTypeId, N'reviewed.cases', N'Gennemgåede sager', N'Json', cast(0 as bit), 90, cast(null as nvarchar(max))),

    (@productGuideTypeId, N'vendor.name', N'Leverandør', N'Text', cast(1 as bit), 10, cast(null as nvarchar(max))),
    (@productGuideTypeId, N'product.name', N'Produkt', N'Text', cast(1 as bit), 20, cast(null as nvarchar(max))),
    (@productGuideTypeId, N'guide.type', N'Vejledningstype', N'Text', cast(1 as bit), 30, cast(null as nvarchar(max))),
    (@productGuideTypeId, N'setting.table', N'Indstillingstabel', N'Json', cast(0 as bit), 40, cast(null as nvarchar(max))),
    (@productGuideTypeId, N'flow.table', N'Flowtabel', N'Json', cast(0 as bit), 50, cast(null as nvarchar(max))),
    (@productGuideTypeId, N'publication.date', N'Udgivelsesdato', N'Text', cast(0 as bit), 60, cast(null as nvarchar(max)))
) as v(DocumentTypeId, FieldKey, Label, DataType, IsRequired, SortOrder, OptionsJson)
where not exists (
    select 1
    from dbo.DocumentTypeFields f
    where f.DocumentTypeId = v.DocumentTypeId and f.FieldKey = v.FieldKey
);

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

insert into dbo.Reports (
    Id, OrganizationId, DocumentTypeId, CustomerId, SiteId, CaseId, ReportNumber, Title, Status, ReviewStatus,
    ReviewScore, PayloadJson, CreatedAt, UpdatedAt, SubmittedAt
)
select v.Id, @orgId, v.DocumentTypeId, v.CustomerId, v.SiteId, v.CaseId, v.ReportNumber, v.Title, v.Status, v.ReviewStatus,
    v.ReviewScore, v.PayloadJson, sysutcdatetime(), sysutcdatetime(), sysutcdatetime()
from (values
    (@workOrderReportId, @workOrderTypeId, @customerId, @siteId, @caseId, N'ARB-DEMO-001', N'Scannet almindelig arbejdsseddel', N'InReview', N'NeedsReview', cast(73.00 as decimal(5,2)), N'{"source":"seed","demo":true,"sourceFile":"Docs/50 - Docs/arbejdssedler_udfyldt-1.pdf"}'),
    (@yellowNoteReportId, @yellowNoteTypeId, null, null, null, N'GUL-DEMO-001', N'Fotograferet gul seddel', N'InReview', N'NeedsReview', cast(58.00 as decimal(5,2)), N'{"source":"seed","demo":true,"sourceFile":"Docs/50 - Docs/gul_seddel.jpg"}'),
    (@floorHeatingBalancingReportId, @floorHeatingBalancingTypeId, @customerId, @siteId, @caseId, N'IND-DEMO-001', N'Gulvvarme indregulering - Bryggers', N'InReview', N'NeedsReview', cast(67.00 as decimal(5,2)), N'{"source":"seed","demo":true,"sourceFile":"Docs/50 - Docs/Indregulering.pdf"}'),
    (@operationMaintenanceReportId, @operationMaintenanceTypeId, @customerId, @siteId, @caseId, N'DV-DEMO-001', N'Drift og vedligehold - standardmappe', N'InReview', N'ReadyForApproval', cast(88.00 as decimal(5,2)), N'{"source":"seed","demo":true,"sourceFile":"Docs/50 - Docs/Drift og vedligehold standard N.P VVS Teknik.pdf"}'),
    (@klsAuditReportId, @klsAuditReportTypeId, null, null, null, N'KLS-DEMO-001', N'KLS efterprøvningsrapport', N'Approved', N'Approved', cast(94.00 as decimal(5,2)), N'{"source":"seed","demo":true,"sourceFile":"Docs/50 - Docs/Efterprøvningsrapport.pdf"}'),
    (@productGuideReportId, @productGuideTypeId, null, null, null, N'VEJL-DEMO-001', N'Tempower indreguleringsvejledning', N'Approved', N'Approved', cast(91.00 as decimal(5,2)), N'{"source":"seed","demo":true,"sourceFile":"Docs/50 - Docs/Tempower_Indreguleringsskemaer_Web_2.pdf"}')
) as v(Id, DocumentTypeId, CustomerId, SiteId, CaseId, ReportNumber, Title, Status, ReviewStatus, ReviewScore, PayloadJson)
where not exists (select 1 from dbo.Reports r where r.Id = v.Id);

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

insert into dbo.DocumentFiles (
    Id, OrganizationId, ReportId, Purpose, StorageAccountName, ContainerName, BlobName, BlobVersionId,
    FileName, ContentType, FileSizeBytes, Sha256Hash, CreatedAt, CreatedByUserId
)
select v.Id, @orgId, v.ReportId, N'OriginalUpload', N'stqrapportdev', N'uploads', v.BlobName, null,
    v.FileName, v.ContentType, v.FileSizeBytes, v.Sha256Hash, sysutcdatetime(), @adminUserId
from (values
    (@workOrderOriginalFileId, @workOrderReportId, N'2026/05/17/arbejdssedler_udfyldt-1.pdf', N'arbejdssedler_udfyldt-1.pdf', N'application/pdf', cast(132576 as bigint), N'demo-arbejdsseddel-sha256'),
    (@yellowNoteOriginalFileId, @yellowNoteReportId, N'2026/05/17/gul_seddel.jpg', N'gul_seddel.jpg', N'image/jpeg', cast(76927 as bigint), N'demo-gul-seddel-sha256'),
    (@floorHeatingBalancingOriginalFileId, @floorHeatingBalancingReportId, N'2026/05/17/indregulering.pdf', N'Indregulering.pdf', N'application/pdf', cast(103601 as bigint), N'demo-indregulering-sha256'),
    (@operationMaintenanceOriginalFileId, @operationMaintenanceReportId, N'2026/05/17/drift-og-vedligehold-standard-np-vvs-teknik.pdf', N'Drift og vedligehold standard N.P VVS Teknik.pdf', N'application/pdf', cast(182732 as bigint), N'demo-drift-vedligehold-sha256'),
    (@klsAuditOriginalFileId, @klsAuditReportId, N'2026/05/17/efterproevningsrapport.pdf', N'Efterprøvningsrapport.pdf', N'application/pdf', cast(177283 as bigint), N'demo-kls-efterproevning-sha256'),
    (@productGuideOriginalFileId, @productGuideReportId, N'2026/05/17/tempower-indreguleringsskemaer-web-2.pdf', N'Tempower_Indreguleringsskemaer_Web_2.pdf', N'application/pdf', cast(182804 as bigint), N'demo-tempower-guide-sha256')
) as v(Id, ReportId, BlobName, FileName, ContentType, FileSizeBytes, Sha256Hash)
where not exists (select 1 from dbo.DocumentFiles f where f.Id = v.Id);

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

update dbo.Reports
set OriginalFileId = case Id
        when @workOrderReportId then @workOrderOriginalFileId
        when @yellowNoteReportId then @yellowNoteOriginalFileId
        when @floorHeatingBalancingReportId then @floorHeatingBalancingOriginalFileId
        when @operationMaintenanceReportId then @operationMaintenanceOriginalFileId
        when @klsAuditReportId then @klsAuditOriginalFileId
        when @productGuideReportId then @productGuideOriginalFileId
        else OriginalFileId
    end,
    ApprovedAt = case when Id in (@klsAuditReportId, @productGuideReportId) then coalesce(ApprovedAt, sysutcdatetime()) else ApprovedAt end,
    ApprovedByUserId = case when Id in (@klsAuditReportId, @productGuideReportId) then coalesce(ApprovedByUserId, @adminUserId) else ApprovedByUserId end,
    UpdatedAt = sysutcdatetime()
where Id in (@workOrderReportId, @yellowNoteReportId, @floorHeatingBalancingReportId, @operationMaintenanceReportId, @klsAuditReportId, @productGuideReportId);

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

insert into dbo.ProcessingRuns (
    Id, ReportId, RunType, Status, ModelProvider, ModelName, ModelVersion, InputFileId, OutputFileId,
    StartedAt, CompletedAt, OutputJson
)
select v.Id, v.ReportId, v.RunType, N'Succeeded', v.ModelProvider, v.ModelName, v.ModelVersion, v.InputFileId, null,
    dateadd(minute, v.StartOffsetMinutes, sysutcdatetime()), dateadd(minute, v.CompletedOffsetMinutes, sysutcdatetime()), v.OutputJson
from (values
    ('c0000000-0000-0000-0000-000000000003', @workOrderReportId, N'OCR', N'Azure Document Intelligence', N'prebuilt-read', N'2024-11-30', @workOrderOriginalFileId, -18, -17, N'{"pages":1,"status":"succeeded","source":"arbejdssedler_udfyldt-1.pdf"}'),
    ('c0000000-0000-0000-0000-000000000004', @workOrderReportId, N'AIExtraction', N'Azure OpenAI', N'gpt-demo', N'1', @workOrderOriginalFileId, -16, -15, N'{"reviewScore":73,"uncertainFields":3}'),
    ('c0000000-0000-0000-0000-000000000005', @yellowNoteReportId, N'OCR', N'Azure Document Intelligence', N'prebuilt-read', N'2024-11-30', @yellowNoteOriginalFileId, -14, -13, N'{"pages":1,"status":"succeeded","source":"gul_seddel.jpg"}'),
    ('c0000000-0000-0000-0000-000000000006', @yellowNoteReportId, N'AIExtraction', N'Azure OpenAI', N'gpt-demo', N'1', @yellowNoteOriginalFileId, -13, -12, N'{"reviewScore":58,"uncertainFields":4}'),
    ('c0000000-0000-0000-0000-000000000007', @floorHeatingBalancingReportId, N'OCR', N'Azure Document Intelligence', N'prebuilt-layout', N'2024-11-30', @floorHeatingBalancingOriginalFileId, -12, -11, N'{"pages":2,"status":"succeeded","source":"Indregulering.pdf"}'),
    ('c0000000-0000-0000-0000-000000000008', @floorHeatingBalancingReportId, N'AIExtraction', N'Azure OpenAI', N'gpt-demo', N'1', @floorHeatingBalancingOriginalFileId, -11, -10, N'{"reviewScore":67,"uncertainFields":3}'),
    ('c0000000-0000-0000-0000-000000000009', @operationMaintenanceReportId, N'OCR', N'Azure Document Intelligence', N'prebuilt-layout', N'2024-11-30', @operationMaintenanceOriginalFileId, -10, -9, N'{"pages":7,"status":"succeeded","source":"Drift og vedligehold standard N.P VVS Teknik.pdf"}'),
    ('c0000000-0000-0000-0000-000000000010', @operationMaintenanceReportId, N'AIExtraction', N'Azure OpenAI', N'gpt-demo', N'1', @operationMaintenanceOriginalFileId, -9, -8, N'{"reviewScore":88,"uncertainFields":1}'),
    ('c0000000-0000-0000-0000-000000000011', @klsAuditReportId, N'OCR', N'Azure Document Intelligence', N'prebuilt-layout', N'2024-11-30', @klsAuditOriginalFileId, -8, -7, N'{"pages":4,"status":"succeeded","source":"Efterprøvningsrapport.pdf"}'),
    ('c0000000-0000-0000-0000-000000000012', @klsAuditReportId, N'AIExtraction', N'Azure OpenAI', N'gpt-demo', N'1', @klsAuditOriginalFileId, -7, -6, N'{"reviewScore":94,"uncertainFields":0}'),
    ('c0000000-0000-0000-0000-000000000013', @productGuideReportId, N'OCR', N'Azure Document Intelligence', N'prebuilt-layout', N'2024-11-30', @productGuideOriginalFileId, -6, -5, N'{"pages":2,"status":"succeeded","source":"Tempower_Indreguleringsskemaer_Web_2.pdf"}'),
    ('c0000000-0000-0000-0000-000000000014', @productGuideReportId, N'AIExtraction', N'Azure OpenAI', N'gpt-demo', N'1', @productGuideOriginalFileId, -5, -4, N'{"reviewScore":91,"uncertainFields":0}')
) as v(Id, ReportId, RunType, ModelProvider, ModelName, ModelVersion, InputFileId, StartOffsetMinutes, CompletedOffsetMinutes, OutputJson)
where not exists (select 1 from dbo.ProcessingRuns pr where pr.Id = v.Id);

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

insert into dbo.ReportFields (
    Id, ReportId, FieldKey, InstanceIndex, Label, DataType, RawValueText, NormalizedValueText, ValueJson,
    Confidence, Status, Source, CreatedAt, UpdatedAt
)
select newid(), v.ReportId, v.FieldKey, v.InstanceIndex, v.Label, v.DataType, v.RawValueText, v.NormalizedValueText, v.ValueJson,
    v.Confidence, v.Status, v.Source, sysutcdatetime(), sysutcdatetime()
from (values
    (@workOrderReportId, N'issuer.name', 0, N'Udsteder/firma', N'Text', N'NP Teknik ApS', N'NP Teknik ApS', cast(null as nvarchar(max)), cast(96.00 as decimal(5,2)), N'Confirmed', N'AI'),
    (@workOrderReportId, N'site.address', 0, N'Arbejdsadresse', N'Text', N'Nebel Skovvej 59, Silkeborg', N'Nebel Skovvej 59, Silkeborg', cast(null as nvarchar(max)), cast(76.00 as decimal(5,2)), N'NeedsReview', N'AI'),
    (@workOrderReportId, N'task.description', 0, N'Opgavebeskrivelse', N'Text', N'køkken, varmt vand + gulvvarme', N'Køkken, varmt vand og gulvvarme', cast(null as nvarchar(max)), cast(69.00 as decimal(5,2)), N'NeedsReview', N'AI'),
    (@workOrderReportId, N'performed.date', 0, N'Dato', N'Date', N'11-02-15 / 7/5-26', N'2026-05-07', cast(null as nvarchar(max)), cast(62.00 as decimal(5,2)), N'NeedsReview', N'OCR'),
    (@workOrderReportId, N'technician.signature', 0, N'Underskrift', N'Text', N'Ulæselig signatur', N'Ulæselig signatur', cast(null as nvarchar(max)), cast(42.00 as decimal(5,2)), N'NeedsReview', N'OCR'),

    (@yellowNoteReportId, N'customer.name', 0, N'Kunde', N'Text', N'Vejnavn / kunde ulæseligt', N'Vejnavn / kunde ulæseligt', cast(null as nvarchar(max)), cast(38.00 as decimal(5,2)), N'NeedsReview', N'OCR'),
    (@yellowNoteReportId, N'note.subject', 0, N'Emne', N'Text', N'slutfaktura', N'Slutfaktura', cast(null as nvarchar(max)), cast(64.00 as decimal(5,2)), N'NeedsReview', N'AI'),
    (@yellowNoteReportId, N'amount.estimated', 0, N'Estimeret beløb', N'Number', N'30.000', N'30000', cast(null as nvarchar(max)), cast(82.00 as decimal(5,2)), N'Confirmed', N'AI'),
    (@yellowNoteReportId, N'labor.hours', 0, N'Timer', N'Number', N'1,5 time', N'1.5', cast(null as nvarchar(max)), cast(91.00 as decimal(5,2)), N'Confirmed', N'AI'),
    (@yellowNoteReportId, N'labor.rate', 0, N'Timesats', N'Number', N'548', N'548', cast(null as nvarchar(max)), cast(88.00 as decimal(5,2)), N'Confirmed', N'AI'),
    (@yellowNoteReportId, N'next.action', 0, N'Næste handling', N'Text', N'Efter ..., at kunden overtager', N'Afklar tekst og send til fakturering', cast(null as nvarchar(max)), cast(45.00 as decimal(5,2)), N'NeedsReview', N'AI'),

    (@floorHeatingBalancingReportId, N'supplier.name', 0, N'Leverandør/system', N'Text', N'Wavin', N'Wavin', cast(null as nvarchar(max)), cast(97.00 as decimal(5,2)), N'Confirmed', N'OCR'),
    (@floorHeatingBalancingReportId, N'customer.name', 0, N'Kunde/projekt', N'Text', N'KNIK ApS', N'KNIK ApS', cast(null as nvarchar(max)), cast(86.00 as decimal(5,2)), N'Confirmed', N'AI'),
    (@floorHeatingBalancingReportId, N'room.name', 0, N'Rum/område', N'Text', N'Bryggers', N'Bryggers', cast(null as nvarchar(max)), cast(66.00 as decimal(5,2)), N'NeedsReview', N'OCR'),
    (@floorHeatingBalancingReportId, N'circuit.rows', 0, N'Kredse og indstillinger', N'Json', null, null, N'[{"circuit":1,"room":"Bryggers","status":"NeedsReview"},{"circuit":2,"status":"NeedsReview"}]', cast(51.00 as decimal(5,2)), N'NeedsReview', N'AI'),
    (@floorHeatingBalancingReportId, N'flow.temperature.c', 0, N'Fremløbstemperatur C', N'Number', N'35', N'35', cast(null as nvarchar(max)), cast(82.00 as decimal(5,2)), N'Confirmed', N'AI'),
    (@floorHeatingBalancingReportId, N'remarks', 0, N'Bemærkninger', N'Text', N'OK', N'OK', cast(null as nvarchar(max)), cast(92.00 as decimal(5,2)), N'Confirmed', N'OCR'),
    (@floorHeatingBalancingReportId, N'performed.date', 0, N'Dato', N'Date', N'11/02 2026', N'2026-02-11', cast(null as nvarchar(max)), cast(79.00 as decimal(5,2)), N'NeedsReview', N'AI'),

    (@operationMaintenanceReportId, N'company.name', 0, N'Virksomhed', N'Text', N'N.P VVS Teknik aps', N'N.P VVS Teknik ApS', cast(null as nvarchar(max)), cast(98.00 as decimal(5,2)), N'Confirmed', N'OCR'),
    (@operationMaintenanceReportId, N'company.cvr', 0, N'CVR', N'Text', N'37236497', N'37236497', cast(null as nvarchar(max)), cast(99.00 as decimal(5,2)), N'Confirmed', N'OCR'),
    (@operationMaintenanceReportId, N'company.address', 0, N'Adresse', N'Text', N'Bødkervej 10, 7480 Vildbjerg', N'Bødkervej 10, 7480 Vildbjerg', cast(null as nvarchar(max)), cast(97.00 as decimal(5,2)), N'Confirmed', N'OCR'),
    (@operationMaintenanceReportId, N'supplier.contacts', 0, N'Leverandørkontakter', N'Json', null, null, N'[{"name":"Sanistål","phone":"87 22 70 00"},{"name":"Herning Vand","phone":"99992299"},{"name":"Wavin","phone":"86 96 20 00"}]', cast(90.00 as decimal(5,2)), N'Confirmed', N'AI'),
    (@operationMaintenanceReportId, N'maintenance.plan', 0, N'Kontrol- og vedligeholdelsesplan', N'Json', null, null, N'[{"component":"Vandmåler","interval":"ugentlig/årlig"},{"component":"Varmtvandstemperatur","interval":"ugentlig"},{"component":"Sikkerhedsventiler","interval":"hver 6. måned"}]', cast(84.00 as decimal(5,2)), N'NeedsReview', N'AI'),

    (@klsAuditReportId, N'audit.date', 0, N'Auditdato', N'Date', N'06-04-2022', N'2022-04-06', cast(null as nvarchar(max)), cast(99.00 as decimal(5,2)), N'Confirmed', N'OCR'),
    (@klsAuditReportId, N'audit.lead_auditor', 0, N'Lead auditor', N'Text', N'Peter Viuf', N'Peter Viuf', cast(null as nvarchar(max)), cast(99.00 as decimal(5,2)), N'Confirmed', N'OCR'),
    (@klsAuditReportId, N'audit.type', 0, N'Audittype', N'Text', N'Efterprøvning', N'Efterprøvning', cast(null as nvarchar(max)), cast(99.00 as decimal(5,2)), N'Confirmed', N'OCR'),
    (@klsAuditReportId, N'company.name', 0, N'Virksomhed', N'Text', N'NP Teknik ApS', N'NP Teknik ApS', cast(null as nvarchar(max)), cast(99.00 as decimal(5,2)), N'Confirmed', N'OCR'),
    (@klsAuditReportId, N'company.cvr', 0, N'CVR', N'Text', N'37236497', N'37236497', cast(null as nvarchar(max)), cast(99.00 as decimal(5,2)), N'Confirmed', N'OCR'),
    (@klsAuditReportId, N'authorization.number', 0, N'Autorisationsnummer', N'Text', N'VFUL-11980', N'VFUL-11980', cast(null as nvarchar(max)), cast(98.00 as decimal(5,2)), N'Confirmed', N'OCR'),
    (@klsAuditReportId, N'conclusion', 0, N'Konklusion', N'Text', N'KLS er dækkende for virksomheden, er effektivt implementeret og indstilles til godkendelse.', N'KLS er dækkende for virksomheden, er effektivt implementeret og indstilles til godkendelse.', cast(null as nvarchar(max)), cast(96.00 as decimal(5,2)), N'Confirmed', N'AI'),
    (@klsAuditReportId, N'reviewed.cases', 0, N'Gennemgåede sager', N'Json', null, null, N'[{"caseNumber":"733","address":"Bøndermosevej 3, 2750 Ballerup"},{"caseNumber":"605","address":"Kaprifolievej 20, 8400 Ebeltoft"},{"caseNumber":"577","address":"Troldeparken 6, 7323 Give"}]', cast(93.00 as decimal(5,2)), N'Confirmed', N'AI'),

    (@productGuideReportId, N'vendor.name', 0, N'Leverandør', N'Text', N'Wavin', N'Wavin', cast(null as nvarchar(max)), cast(99.00 as decimal(5,2)), N'Confirmed', N'OCR'),
    (@productGuideReportId, N'product.name', 0, N'Produkt', N'Text', N'Tempower fordelerrør', N'Tempower fordelerrør', cast(null as nvarchar(max)), cast(99.00 as decimal(5,2)), N'Confirmed', N'OCR'),
    (@productGuideReportId, N'guide.type', 0, N'Vejledningstype', N'Text', N'Indreguleringsvejledning', N'Indreguleringsvejledning', cast(null as nvarchar(max)), cast(97.00 as decimal(5,2)), N'Confirmed', N'AI'),
    (@productGuideReportId, N'flow.table', 0, N'Flowtabel', N'Json', null, null, N'[{"pipeLengthM":120,"areaM2":36.0,"flowLMin":5.4},{"pipeLengthM":100,"areaM2":30.0,"flowLMin":4.5},{"pipeLengthM":50,"areaM2":15.0,"flowLMin":2.3}]', cast(88.00 as decimal(5,2)), N'Confirmed', N'AI'),
    (@productGuideReportId, N'publication.date', 0, N'Udgivelsesdato', N'Text', N'September 2017', N'2017-09', cast(null as nvarchar(max)), cast(96.00 as decimal(5,2)), N'Confirmed', N'OCR')
) as v(ReportId, FieldKey, InstanceIndex, Label, DataType, RawValueText, NormalizedValueText, ValueJson, Confidence, Status, Source)
where not exists (
    select 1
    from dbo.ReportFields f
    where f.ReportId = v.ReportId and f.FieldKey = v.FieldKey and f.InstanceIndex = v.InstanceIndex
);

if not exists (select 1 from dbo.ReviewIssues where Id = 'd0000000-0000-0000-0000-000000000001')
    insert into dbo.ReviewIssues (Id, ReportId, FieldId, Severity, IssueType, Message, Status, CreatedAt)
    values (
        'd0000000-0000-0000-0000-000000000001', @reportId, @signatureDateFieldId, N'Medium', N'LowConfidence',
        N'Underskriftsdato er læst med lav sikkerhed og bør kontrolleres mod originalen.', N'Open', sysutcdatetime()
    );

insert into dbo.ReviewIssues (Id, ReportId, FieldId, Severity, IssueType, Message, Status, CreatedAt)
select v.Id, v.ReportId, null, v.Severity, v.IssueType, v.Message, N'Open', sysutcdatetime()
from (values
    ('d0000000-0000-0000-0000-000000000002', @yellowNoteReportId, N'High', N'LowConfidence', N'Den gule seddel er håndskrevet og kræver manuel kontrol af kunde, emne og næste handling.'),
    ('d0000000-0000-0000-0000-000000000003', @floorHeatingBalancingReportId, N'Medium', N'LowConfidence', N'Kredstabellen i indreguleringsskemaet er svær at aflæse og bør kontrolleres mod originalen.'),
    ('d0000000-0000-0000-0000-000000000004', @workOrderReportId, N'Medium', N'LowConfidence', N'Almindelig arbejdsseddel har usikker dato/underskrift og bør gennemgås før godkendelse.'),
    ('d0000000-0000-0000-0000-000000000005', @operationMaintenanceReportId, N'Low', N'NeedsHumanCheck', N'Drift- og vedligeholdelsesplanen er udtrukket som struktureret JSON og bør stikprøvekontrolleres.')
) as v(Id, ReportId, Severity, IssueType, Message)
where not exists (select 1 from dbo.ReviewIssues ri where ri.Id = v.Id);

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
