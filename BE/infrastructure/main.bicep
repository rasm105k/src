param companyName string = ''
param location string = resourceGroup().location
param environment string = 'dev'
param notificationEmail string = ''

param functionAppName string          = 'func-${companyName}-${toLower(environment)}'
param storageAccountName string       = take('st${companyName}${toLower(environment)}', 24)
param logicAppName string             = 'la-${companyName}-${toLower(environment)}'
param appInsightsName string          = 'ai-${companyName}-${toLower(environment)}'
param logAnalyticsName string         = 'law-${companyName}-${toLower(environment)}'
param identityName string             = 'id-${companyName}-${toLower(environment)}'
param keyVaultName string             = take('kv-${companyName}-${toLower(environment)}', 24)
param documentIntelligenceName string = 'di-${companyName}-${toLower(environment)}'

// ── Role definition IDs ───────────────────────────────────────────────────────
// Centralised here so they're easy to audit and update.
var roles = {
  keyVaultSecretsUser:     '4633458b-436e-492d-b285-4f6b7b5e48d1'
  cognitiveServicesUser:   'a97b65f3-24c7-4dac-a4ac-c5b2943a82d4'
  storageBlobContributor:  'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
  storageQueueContributor: '974c5e8b-45b9-4653-ba55-5f855dd0fb88'
  storageTableContributor: '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3'
}

var tags = {
  environment: environment
  project: companyName
}

// ──────────────────────────────────────────────────────────────────────────────
// User-Assigned Managed Identity
// One identity, shared by all resources. All RBAC is granted to this identity.
// ──────────────────────────────────────────────────────────────────────────────

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
  tags: tags
}


// ──────────────────────────────────────────────────────────────────────────────
// Monitoring
// ──────────────────────────────────────────────────────────────────────────────

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
   identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${identity.id}': {} }
  }
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Key Vault
// RBAC-mode only (no access policies). Identity gets Secrets User.
// ──────────────────────────────────────────────────────────────────────────────

resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: { name: 'standard', family: 'A' }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enablePurgeProtection: true
  }
}

resource kvRoleIdentity 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid('${keyVault.id}${identity.id}${roles.keyVaultSecretsUser}')
  scope: keyVault
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: roles.keyVaultSecretsUser
  }
}

// ──────────────────────────────────────────────────────────
// Storage Account
// Used by both the Function App runtime and as document storage.
// Identity needs Blob + Queue + Table contributor for the Functions runtime.
// ──────────────────────────────────────────────────────────────────────────────

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: { name: 'Standard_LRS' }
  tags: tags
  properties: {
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: { enabled: true, days: 7 }
  }
}

resource uploadsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'uploads'
}

resource documentsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'documents'
}

resource storageRoleBlob 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid('${storageAccount.id}${identity.id}${roles.storageBlobContributor}')
  scope: storageAccount
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.storageBlobContributor)
  }
}

// Required by the Functions runtime when using managed identity for AzureWebJobsStorage
resource storageRoleQueue 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid('${storageAccount.id}${identity.id}${roles.storageQueueContributor}')
  scope: storageAccount
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.storageQueueContributor)
  }
}

resource storageRoleTable 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid('${storageAccount.id}${identity.id}${roles.storageTableContributor}')
  scope: storageAccount
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.storageTableContributor)
  }
}
// ──────────────────────────────────────────────────────────────────────────────
// Document Intelligence
// ──────────────────────────────────────────────────────────────────────────────

resource documentIntelligence 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: documentIntelligenceName
  location: location
  kind: 'FormRecognizer'
  sku: { name: 'S0' }
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${identity.id}': {} }
  }
  properties: {
    restore: false
    customSubDomainName: documentIntelligenceName
    publicNetworkAccess: 'Enabled'
  }
}

resource diRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid('${documentIntelligence.id}${identity.id}${roles.cognitiveServicesUser}')
  scope: documentIntelligence
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.cognitiveServicesUser)
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Function App
// ──────────────────────────────────────────────────────────────────────────────

resource hostingPlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: 'asp-${companyName}-${toLower(environment)}'
  location: location
  kind: 'linux'
  sku: { name: 'Y1', tier: 'Dynamic' }
  tags: tags
  properties: {
    reserved: true
  }
}

resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${identity.id}': {} }
  }
  properties: {
    serverFarmId: hostingPlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNET-ISOLATED|8.0'
      alwaysOn: false
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: [
        { name: 'FUNCTIONS_WORKER_RUNTIME',              value: 'dotnet-isolated' }
        { name: 'FUNCTIONS_EXTENSION_VERSION',           value: '~4' }
        { name: 'AzureWebJobsStorage__accountName',      value: storageAccount.name }
        { name: 'AzureWebJobsStorage__credential',       value: 'managedidentity' }
        { name: 'AzureWebJobsStorage__clientId',         value: identity.properties.clientId }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        { name: 'AZURE_CLIENT_ID',                       value: identity.properties.clientId }
        { name: 'UPLOAD_CONTAINER',                      value: 'uploads' }
        { name: 'STORAGE_ACCOUNT_NAME',                  value: storageAccount.name }
        { name: 'KEY_VAULT_URL',                         value: keyVault.properties.vaultUri }
        { name: 'DOCUMENT_INTELLIGENCE_ENDPOINT',        value: documentIntelligence.properties.endpoint }
      ]
    }
  }
}




// ──────────────────────────────────────────────────────────────────────────────
// Logic App Workflow
// ──────────────────────────────────────────────────────────────────────────────

var workflowTemplate = loadTextContent('./logic-app/workflow.json')

var workflowDefinition = json(
  replace(
    replace(
      replace(
        replace(workflowTemplate,
          '__SUB_ID__',        subscription().subscriptionId),
          '__STORAGE_NAME__',  storageAccountName),
          '__NOTIFICATION_EMAIL__', notificationEmail),
          '__ACS_SENDER__',    ''
  )
)

resource logicApp 'Microsoft.Logic/workflows@2019-05-01' = {
  name: logicAppName
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${identity.id}': {} }
  }
  properties: {
    state: 'Enabled'
    definition: workflowDefinition
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Outputs
// ──────────────────────────────────────────────────────────────────────────────

output STORAGE_ACCOUNT_NAME string             = storageAccount.name
output FUNCTION_APP_NAME string                = functionAppName
output LOGIC_APP_NAME string                   = logicAppName
output MANAGED_IDENTITY_CLIENT_ID string       = identity.properties.clientId
output MANAGED_IDENTITY_PRINCIPAL_ID string    = identity.properties.principalId
output APP_INSIGHTS_CONNECTION_STRING string   = appInsights.properties.ConnectionString
output KEY_VAULT_URI string                    = keyVault.properties.vaultUri
output DOCUMENT_INTELLIGENCE_ENDPOINT string   = documentIntelligence.properties.endpoint
output DOCUMENT_INTELLIGENCE_NAME string       = documentIntelligenceName
