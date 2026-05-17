set ansi_nulls on;
set quoted_identifier on;

create table dbo.Sites (
    Id uniqueidentifier not null constraint PK_Sites primary key,
    OrganizationId uniqueidentifier not null,
    CustomerId uniqueidentifier null,
    Name nvarchar(240) null,
    Address nvarchar(500) not null,
    CreatedAt datetimeoffset not null constraint DF_Sites_CreatedAt default sysutcdatetime(),
    UpdatedAt datetimeoffset not null constraint DF_Sites_UpdatedAt default sysutcdatetime(),
    constraint FK_Sites_Organizations foreign key (OrganizationId) references dbo.Organizations(Id),
    constraint FK_Sites_Customers foreign key (CustomerId) references dbo.Customers(Id)
);

create index IX_Sites_Organization_Customer
on dbo.Sites (OrganizationId, CustomerId);

create table dbo.Cases (
    Id uniqueidentifier not null constraint PK_Cases primary key,
    OrganizationId uniqueidentifier not null,
    CustomerId uniqueidentifier null,
    SiteId uniqueidentifier null,
    CaseNumber nvarchar(100) null,
    Title nvarchar(240) not null,
    Description nvarchar(max) null,
    Status nvarchar(40) not null constraint DF_Cases_Status default 'Open',
    CreatedAt datetimeoffset not null constraint DF_Cases_CreatedAt default sysutcdatetime(),
    UpdatedAt datetimeoffset not null constraint DF_Cases_UpdatedAt default sysutcdatetime(),
    constraint FK_Cases_Organizations foreign key (OrganizationId) references dbo.Organizations(Id),
    constraint FK_Cases_Customers foreign key (CustomerId) references dbo.Customers(Id),
    constraint FK_Cases_Sites foreign key (SiteId) references dbo.Sites(Id),
    constraint CK_Cases_Status check (Status in ('Open', 'Closed', 'Archived'))
);

create index IX_Cases_Organization_Status_UpdatedAt
on dbo.Cases (OrganizationId, Status, UpdatedAt desc);

create table dbo.DocumentTypes (
    Id uniqueidentifier not null constraint PK_DocumentTypes primary key,
    Code nvarchar(100) not null,
    Name nvarchar(240) not null,
    Version int not null,
    SchemaJson nvarchar(max) null,
    IsActive bit not null constraint DF_DocumentTypes_IsActive default 1,
    CreatedAt datetimeoffset not null constraint DF_DocumentTypes_CreatedAt default sysutcdatetime(),
    UpdatedAt datetimeoffset not null constraint DF_DocumentTypes_UpdatedAt default sysutcdatetime(),
    constraint UX_DocumentTypes_Code_Version unique (Code, Version),
    constraint CK_DocumentTypes_SchemaJson_IsJson check (SchemaJson is null or isjson(SchemaJson) = 1)
);

create table dbo.DocumentTypeFields (
    Id uniqueidentifier not null constraint PK_DocumentTypeFields primary key,
    DocumentTypeId uniqueidentifier not null,
    FieldKey nvarchar(200) not null,
    Label nvarchar(240) not null,
    DataType nvarchar(60) not null,
    IsRequired bit not null constraint DF_DocumentTypeFields_IsRequired default 0,
    SortOrder int not null constraint DF_DocumentTypeFields_SortOrder default 0,
    OptionsJson nvarchar(max) null,
    CreatedAt datetimeoffset not null constraint DF_DocumentTypeFields_CreatedAt default sysutcdatetime(),
    UpdatedAt datetimeoffset not null constraint DF_DocumentTypeFields_UpdatedAt default sysutcdatetime(),
    constraint FK_DocumentTypeFields_DocumentTypes foreign key (DocumentTypeId) references dbo.DocumentTypes(Id) on delete cascade,
    constraint UX_DocumentTypeFields_Type_FieldKey unique (DocumentTypeId, FieldKey),
    constraint CK_DocumentTypeFields_DataType check (DataType in ('Text', 'Number', 'Date', 'Boolean', 'Choice', 'MultiChoice', 'Json')),
    constraint CK_DocumentTypeFields_OptionsJson_IsJson check (OptionsJson is null or isjson(OptionsJson) = 1)
);

create table dbo.Reports (
    Id uniqueidentifier not null constraint PK_Reports primary key,
    OrganizationId uniqueidentifier not null,
    DocumentTypeId uniqueidentifier not null,
    CustomerId uniqueidentifier null,
    SiteId uniqueidentifier null,
    CaseId uniqueidentifier null,
    ReportNumber nvarchar(100) null,
    Title nvarchar(240) null,
    Status nvarchar(40) not null,
    ReviewStatus nvarchar(40) not null,
    ReviewScore decimal(5,2) null,
    OriginalFileId uniqueidentifier null,
    GeneratedPdfFileId uniqueidentifier null,
    PayloadJson nvarchar(max) null,
    CreatedAt datetimeoffset not null,
    UpdatedAt datetimeoffset not null,
    SubmittedAt datetimeoffset null,
    ApprovedAt datetimeoffset null,
    ApprovedByUserId uniqueidentifier null,
    constraint FK_Reports_Organizations foreign key (OrganizationId) references dbo.Organizations(Id),
    constraint FK_Reports_DocumentTypes foreign key (DocumentTypeId) references dbo.DocumentTypes(Id),
    constraint FK_Reports_Customers foreign key (CustomerId) references dbo.Customers(Id),
    constraint FK_Reports_Sites foreign key (SiteId) references dbo.Sites(Id),
    constraint FK_Reports_Cases foreign key (CaseId) references dbo.Cases(Id),
    constraint FK_Reports_ApprovedBy foreign key (ApprovedByUserId) references dbo.Users(Id),
    constraint CK_Reports_Status check (Status in ('Draft', 'Uploaded', 'Processing', 'InReview', 'Approved', 'Rejected', 'Archived')),
    constraint CK_Reports_ReviewStatus check (ReviewStatus in ('NotStarted', 'Processing', 'NeedsReview', 'ReadyForApproval', 'Approved', 'Rejected')),
    constraint CK_Reports_ReviewScore check (ReviewScore is null or (ReviewScore >= 0 and ReviewScore <= 100)),
    constraint CK_Reports_PayloadJson_IsJson check (PayloadJson is null or isjson(PayloadJson) = 1)
);

create index IX_Reports_Organization_Status_UpdatedAt
on dbo.Reports (OrganizationId, Status, UpdatedAt desc);

create index IX_Reports_Organization_DocumentType_UpdatedAt
on dbo.Reports (OrganizationId, DocumentTypeId, UpdatedAt desc);

create table dbo.DocumentFiles (
    Id uniqueidentifier not null constraint PK_DocumentFiles primary key,
    OrganizationId uniqueidentifier not null,
    ReportId uniqueidentifier null,
    Purpose nvarchar(60) not null,
    StorageAccountName nvarchar(120) not null,
    ContainerName nvarchar(120) not null,
    BlobName nvarchar(1024) not null,
    BlobVersionId nvarchar(200) null,
    FileName nvarchar(260) not null,
    ContentType nvarchar(160) not null,
    FileSizeBytes bigint not null,
    Sha256Hash nvarchar(128) null,
    CreatedAt datetimeoffset not null,
    CreatedByUserId uniqueidentifier null,
    constraint FK_DocumentFiles_Organizations foreign key (OrganizationId) references dbo.Organizations(Id),
    constraint FK_DocumentFiles_Reports foreign key (ReportId) references dbo.Reports(Id) on delete cascade,
    constraint FK_DocumentFiles_CreatedBy foreign key (CreatedByUserId) references dbo.Users(Id),
    constraint CK_DocumentFiles_Purpose check (Purpose in ('OriginalUpload', 'GeneratedPdf', 'OcrJson', 'AiJson', 'Attachment')),
    constraint CK_DocumentFiles_FileSizeBytes check (FileSizeBytes >= 0)
);

create index IX_DocumentFiles_Report_Purpose_CreatedAt
on dbo.DocumentFiles (ReportId, Purpose, CreatedAt desc);

alter table dbo.Reports
add constraint FK_Reports_OriginalFile foreign key (OriginalFileId) references dbo.DocumentFiles(Id);

alter table dbo.Reports
add constraint FK_Reports_GeneratedPdfFile foreign key (GeneratedPdfFileId) references dbo.DocumentFiles(Id);

create table dbo.ProcessingRuns (
    Id uniqueidentifier not null constraint PK_ProcessingRuns primary key,
    ReportId uniqueidentifier not null,
    RunType nvarchar(60) not null,
    Status nvarchar(40) not null,
    ModelProvider nvarchar(120) null,
    ModelName nvarchar(160) null,
    ModelVersion nvarchar(120) null,
    InputFileId uniqueidentifier null,
    OutputFileId uniqueidentifier null,
    StartedAt datetimeoffset not null,
    CompletedAt datetimeoffset null,
    ErrorMessage nvarchar(max) null,
    OutputJson nvarchar(max) null,
    constraint FK_ProcessingRuns_Reports foreign key (ReportId) references dbo.Reports(Id) on delete cascade,
    constraint FK_ProcessingRuns_InputFile foreign key (InputFileId) references dbo.DocumentFiles(Id),
    constraint FK_ProcessingRuns_OutputFile foreign key (OutputFileId) references dbo.DocumentFiles(Id),
    constraint CK_ProcessingRuns_RunType check (RunType in ('OCR', 'AIExtraction', 'ReviewScoring', 'PdfGeneration')),
    constraint CK_ProcessingRuns_Status check (Status in ('Queued', 'Running', 'Succeeded', 'Failed', 'Cancelled')),
    constraint CK_ProcessingRuns_OutputJson_IsJson check (OutputJson is null or isjson(OutputJson) = 1)
);

create index IX_ProcessingRuns_Report_StartedAt
on dbo.ProcessingRuns (ReportId, StartedAt desc);

create table dbo.ReportFields (
    Id uniqueidentifier not null constraint PK_ReportFields primary key,
    ReportId uniqueidentifier not null,
    FieldKey nvarchar(200) not null,
    InstanceIndex int not null constraint DF_ReportFields_InstanceIndex default 0,
    Label nvarchar(240) not null,
    DataType nvarchar(60) not null,
    RawValueText nvarchar(max) null,
    NormalizedValueText nvarchar(max) null,
    CorrectedValueText nvarchar(max) null,
    ValueJson nvarchar(max) null,
    Confidence decimal(5,2) null,
    Status nvarchar(40) not null,
    Source nvarchar(40) not null,
    BoundingRegionsJson nvarchar(max) null,
    CorrectedByUserId uniqueidentifier null,
    CorrectedAt datetimeoffset null,
    CreatedAt datetimeoffset not null,
    UpdatedAt datetimeoffset not null,
    constraint FK_ReportFields_Reports foreign key (ReportId) references dbo.Reports(Id) on delete cascade,
    constraint FK_ReportFields_CorrectedBy foreign key (CorrectedByUserId) references dbo.Users(Id),
    constraint UX_ReportFields_Report_Field_Instance unique (ReportId, FieldKey, InstanceIndex),
    constraint CK_ReportFields_DataType check (DataType in ('Text', 'Number', 'Date', 'Boolean', 'Choice', 'MultiChoice', 'Json')),
    constraint CK_ReportFields_Confidence check (Confidence is null or (Confidence >= 0 and Confidence <= 100)),
    constraint CK_ReportFields_Status check (Status in ('Confirmed', 'NeedsReview', 'Missing', 'Conflict', 'Corrected')),
    constraint CK_ReportFields_Source check (Source in ('OCR', 'AI', 'User', 'System')),
    constraint CK_ReportFields_ValueJson_IsJson check (ValueJson is null or isjson(ValueJson) = 1),
    constraint CK_ReportFields_BoundingRegionsJson_IsJson check (BoundingRegionsJson is null or isjson(BoundingRegionsJson) = 1)
);

create index IX_ReportFields_Report_Status
on dbo.ReportFields (ReportId, Status);

create table dbo.ReviewIssues (
    Id uniqueidentifier not null constraint PK_ReviewIssues primary key,
    ReportId uniqueidentifier not null,
    FieldId uniqueidentifier null,
    Severity nvarchar(40) not null,
    IssueType nvarchar(80) not null,
    Message nvarchar(max) not null,
    Status nvarchar(40) not null,
    CreatedAt datetimeoffset not null,
    ResolvedAt datetimeoffset null,
    ResolvedByUserId uniqueidentifier null,
    constraint FK_ReviewIssues_Reports foreign key (ReportId) references dbo.Reports(Id) on delete cascade,
    constraint FK_ReviewIssues_ReportFields foreign key (FieldId) references dbo.ReportFields(Id),
    constraint FK_ReviewIssues_ResolvedBy foreign key (ResolvedByUserId) references dbo.Users(Id),
    constraint CK_ReviewIssues_Severity check (Severity in ('Low', 'Medium', 'High')),
    constraint CK_ReviewIssues_Status check (Status in ('Open', 'Resolved', 'Dismissed'))
);

create index IX_ReviewIssues_Report_Status_Severity
on dbo.ReviewIssues (ReportId, Status, Severity);

create table dbo.Approvals (
    Id uniqueidentifier not null constraint PK_Approvals primary key,
    ReportId uniqueidentifier not null,
    ApprovedByUserId uniqueidentifier not null,
    Role nvarchar(80) not null,
    Decision nvarchar(40) not null,
    Comment nvarchar(max) null,
    SnapshotJson nvarchar(max) null,
    CreatedAt datetimeoffset not null,
    constraint FK_Approvals_Reports foreign key (ReportId) references dbo.Reports(Id) on delete cascade,
    constraint FK_Approvals_Users foreign key (ApprovedByUserId) references dbo.Users(Id),
    constraint CK_Approvals_Decision check (Decision in ('Approved', 'Rejected')),
    constraint CK_Approvals_SnapshotJson_IsJson check (SnapshotJson is null or isjson(SnapshotJson) = 1)
);

create index IX_Approvals_Report_CreatedAt
on dbo.Approvals (ReportId, CreatedAt desc);

create table dbo.AuditEvents (
    Id uniqueidentifier not null constraint PK_AuditEvents primary key,
    OrganizationId uniqueidentifier not null,
    ReportId uniqueidentifier null,
    FileId uniqueidentifier null,
    ActorId uniqueidentifier null,
    EventType nvarchar(100) not null,
    EntityType nvarchar(80) not null,
    BeforeJson nvarchar(max) null,
    AfterJson nvarchar(max) null,
    CorrelationId nvarchar(120) null,
    CreatedAt datetimeoffset not null,
    constraint FK_AuditEvents_Organizations foreign key (OrganizationId) references dbo.Organizations(Id),
    constraint FK_AuditEvents_Reports foreign key (ReportId) references dbo.Reports(Id),
    constraint FK_AuditEvents_DocumentFiles foreign key (FileId) references dbo.DocumentFiles(Id),
    constraint FK_AuditEvents_Users foreign key (ActorId) references dbo.Users(Id),
    constraint CK_AuditEvents_BeforeJson_IsJson check (BeforeJson is null or isjson(BeforeJson) = 1),
    constraint CK_AuditEvents_AfterJson_IsJson check (AfterJson is null or isjson(AfterJson) = 1)
);

create index IX_AuditEvents_Report_CreatedAt
on dbo.AuditEvents (ReportId, CreatedAt desc);

create index IX_AuditEvents_Organization_CreatedAt
on dbo.AuditEvents (OrganizationId, CreatedAt desc);
