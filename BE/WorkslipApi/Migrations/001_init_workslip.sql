create table dbo.Organizations (
    Id uniqueidentifier not null constraint PK_Organizations primary key,
    Name nvarchar(200) not null,
    CreatedAt datetimeoffset not null constraint DF_Organizations_CreatedAt default sysutcdatetime(),
    UpdatedAt datetimeoffset not null constraint DF_Organizations_UpdatedAt default sysutcdatetime()
);

create table dbo.Users (
    Id uniqueidentifier not null constraint PK_Users primary key,
    OrganizationId uniqueidentifier not null,
    DisplayName nvarchar(200) not null,
    Email nvarchar(320) null,
    Role nvarchar(80) not null,
    CreatedAt datetimeoffset not null constraint DF_Users_CreatedAt default sysutcdatetime(),
    UpdatedAt datetimeoffset not null constraint DF_Users_UpdatedAt default sysutcdatetime(),
    constraint FK_Users_Organizations foreign key (OrganizationId) references dbo.Organizations(Id)
);

create table dbo.Customers (
    Id uniqueidentifier not null constraint PK_Customers primary key,
    OrganizationId uniqueidentifier not null,
    Name nvarchar(240) not null,
    Address nvarchar(500) null,
    ContactPerson nvarchar(200) null,
    Phone nvarchar(80) null,
    CreatedAt datetimeoffset not null constraint DF_Customers_CreatedAt default sysutcdatetime(),
    UpdatedAt datetimeoffset not null constraint DF_Customers_UpdatedAt default sysutcdatetime(),
    constraint FK_Customers_Organizations foreign key (OrganizationId) references dbo.Organizations(Id)
);

create table dbo.WorkslipReports (
    Id uniqueidentifier not null constraint PK_WorkslipReports primary key,
    OrganizationId uniqueidentifier not null,
    ReportNumber nvarchar(80) not null,
    Status nvarchar(40) not null,
    CustomerName nvarchar(240) not null,
    CustomerAddress nvarchar(500) not null,
    ContactPerson nvarchar(200) null,
    Phone nvarchar(80) null,
    ReportDate date null,
    TaskDescription nvarchar(max) not null,
    CustomerObservations nvarchar(max) null,
    InstallationTypesJson nvarchar(max) not null constraint DF_WorkslipReports_InstallationTypesJson default '[]',
    WorkKind nvarchar(80) not null,
    CustomWorkKind nvarchar(160) null,
    Remarks nvarchar(max) null,
    ClosureFlagsJson nvarchar(max) not null constraint DF_WorkslipReports_ClosureFlagsJson default '[]',
    PayloadJson nvarchar(max) null,
    CreatedAt datetimeoffset not null,
    UpdatedAt datetimeoffset not null,
    SubmittedAt datetimeoffset null,
    constraint FK_WorkslipReports_Organizations foreign key (OrganizationId) references dbo.Organizations(Id),
    constraint CK_WorkslipReports_Status check (Status in ('Draft', 'Submitted', 'InReview', 'Approved', 'Rejected', 'Archived')),
    constraint CK_WorkslipReports_InstallationTypesJson_IsJson check (isjson(InstallationTypesJson) = 1),
    constraint CK_WorkslipReports_ClosureFlagsJson_IsJson check (isjson(ClosureFlagsJson) = 1),
    constraint CK_WorkslipReports_PayloadJson_IsJson check (PayloadJson is null or isjson(PayloadJson) = 1)
);

create index IX_WorkslipReports_Organization_Status_UpdatedAt
on dbo.WorkslipReports (OrganizationId, Status, UpdatedAt desc);

create table dbo.WorkslipControlChecks (
    Id uniqueidentifier not null constraint PK_WorkslipControlChecks primary key,
    ReportId uniqueidentifier not null,
    StageId nvarchar(100) not null,
    ColumnId nvarchar(100) not null,
    ItemId nvarchar(160) not null,
    Checked bit not null,
    Note nvarchar(max) null,
    CreatedAt datetimeoffset not null,
    UpdatedAt datetimeoffset not null,
    constraint FK_WorkslipControlChecks_WorkslipReports foreign key (ReportId) references dbo.WorkslipReports(Id) on delete cascade
);

create unique index UX_WorkslipControlChecks_Report_Stage_Column_Item
on dbo.WorkslipControlChecks (ReportId, StageId, ColumnId, ItemId);

create table dbo.WorkslipEvents (
    Id uniqueidentifier not null constraint PK_WorkslipEvents primary key,
    ReportId uniqueidentifier not null,
    ActorId uniqueidentifier null,
    EventType nvarchar(80) not null,
    BeforeJson nvarchar(max) null,
    AfterJson nvarchar(max) null,
    CreatedAt datetimeoffset not null,
    constraint FK_WorkslipEvents_WorkslipReports foreign key (ReportId) references dbo.WorkslipReports(Id) on delete cascade,
    constraint FK_WorkslipEvents_Users foreign key (ActorId) references dbo.Users(Id),
    constraint CK_WorkslipEvents_BeforeJson_IsJson check (BeforeJson is null or isjson(BeforeJson) = 1),
    constraint CK_WorkslipEvents_AfterJson_IsJson check (AfterJson is null or isjson(AfterJson) = 1)
);

create index IX_WorkslipEvents_Report_CreatedAt
on dbo.WorkslipEvents (ReportId, CreatedAt desc);
