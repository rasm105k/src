param companyName string = 'TEMPLATE'
param location string = resourceGroup().location
param environment string = 'dev'
param notificationEmail string = ''
param functionAppName string = 'func-${companyName}-${toLower(environment)}'
param storageAccountName string = take('st${companyName}${toLower(environment)}', 24)
param logicAppName string = 'la-docprocessor-${toLower(environment)}'
param appInsightsName string = 'ai-${companyName}-${toLower(environment)}'
param logAnalyticsName string = 'la-${companyName}-${toLower(environment)}'
param identityName string = 'id-${companyName}-${toLower(environment)}'
param keyVaultName string = take('kv-${companyName}-${toLower(environment)}', 24)
param documentIntelligenceName string = 'di-${companyName}-${toLower(environment)}'

var tags = {
  environment: environment
  project: companyName
}

// ──────────────────────────────────────────────
// Monitoring
// ──────────────────────────────────────────────

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2021-12-01-preview' = {
  name: logAnalyticsName
  location: location
  tags: tags
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

// ──────────────────────────────────────────────
// Identity
// ──────────────────────────────────────────────

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2018-11-30' = {
  name: identityName
  location: location
  tags: tags
}

// ──────────────────────────────────────────────
// Key Vault
// ──────────────────────────────────────────────

resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: { name: 'standard', family: 'A' }
    enableSoftDelete: true
    enablePurgeProtection: true
    softDeleteRetentionInDays: 7
    enableRbacAuthorization: true
    tenantId: subscription().tenantId
  }
}

resource keyVaultSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, identity.id, '4633458b-436e-492d-b285-4f6b7b5e48d1')
  scope: keyVault
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-436e-492d-b285-4f6b7b5e48d1')
  }
}

// ──────────────────────────────────────────────
// Document Intelligence
// ──────────────────────────────────────────────

resource documentIntelligence 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: documentIntelligenceName
  location: location
  kind: 'FormRecognizer'
  sku: { name: 'S0' }
  tags: tags
  properties: {
    customSubDomainName: documentIntelligenceName
    publicNetworkAccess: 'Enabled'
  }
}

resource diCognitiveServicesUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(documentIntelligence.id, identity.id, '97f73555-30d5-4b2b-93e6-34f8b6e6f1c2')
  scope: documentIntelligence
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '97f73555-30d5-4b2b-93e6-34f8b6e6f1c2')
  }
}

// ──────────────────────────────────────────────
// Storage
// ──────────────────────────────────────────────

resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
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

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2022-09-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: { enabled: true, days: 7 }
  }
}

resource uploadsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  parent: blobService
  name: 'uploads'
}

resource documentsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  parent: blobService
  name: 'documents'
}

// ──────────────────────────────────────────────
// Function App (Consumption Plan, Linux, .NET)
// ──────────────────────────────────────────────

resource hostingPlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: 'asp-${companyName}-${toLower(environment)}'
  location: location
  kind: 'linux'
  sku: { name: 'Y1', tier: 'Dynamic' }
  tags: tags
  properties: {
    reserved: true
  }
}

resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  tags: tags
  identity: {
    type: 'SystemAssigned, UserAssigned'
    userAssignedIdentities: { '${identity.id}': {} }
  }
  properties: {
    serverFarmId: hostingPlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNET-ISOLATED|10.0'
      alwaysOn: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: [
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'dotnet-isolated' }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'AzureWebJobsStorage__accountName', value: storageAccount.name }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        { name: 'UPLOAD_CONTAINER', value: 'uploads' }
        { name: 'STORAGE_ACCOUNT_NAME', value: storageAccount.name }
        { name: 'AZURE_CLIENT_ID', value: identity.properties.clientId }
        { name: 'KEY_VAULT_URL', value: keyVault.properties.vaultUri }
        { name: 'DOCUMENT_INTELLIGENCE_ENDPOINT', value: documentIntelligence.properties.endpoint }
      ]
    }
  }
}

// ──────────────────────────────────────────────
// API Connections (used by Logic App)
// ──────────────────────────────────────────────

resource blobConnection 'Microsoft.Web/connections@2016-06-01' = {
  name: 'as-${companyName}-blob-${toLower(environment)}'
  location: location
  tags: tags
  properties: {
    displayName: 'Blob Connection'
    api: { id: subscriptionResourceId('Microsoft.Web/locations/managedApis', location, 'azureblob') }
    parameterValues: {
      authType: 'ManagedServiceIdentity'
      identityId: identity.id
    }
  }
}

resource documentIntelligenceConnection 'Microsoft.Web/connections@2016-06-01' = {
  name: 'as-${companyName}-di-${toLower(environment)}'
  location: location
  tags: tags
  properties: {
    displayName: 'Document Intelligence Connection'
    api: { id: subscriptionResourceId('Microsoft.Web/locations/managedApis', location, 'formrecognizer') }
    parameterValues: {
      authType: 'ManagedServiceIdentity'
      identityId: identity.id
    }
  }
}

resource outlookConnection 'Microsoft.Web/connections@2016-06-01' = {
  name: 'as-${companyName}-outlook-${toLower(environment)}'
  location: location
  tags: tags
  properties: {
    displayName: 'Outlook Connection'
    api: { id: subscriptionResourceId('Microsoft.Web/locations/managedApis', location, 'outlook') }
    parameterValues: {
      authType: 'ManagedServiceIdentity'
      identityId: identity.id
    }
  }
}

// ──────────────────────────────────────────────
// Logic App
//
// The workflow definition is loaded from the
// workflow.json file at compile time.
// Placeholders are substituted at deploy time.
// ──────────────────────────────────────────────

var workflowTemplate = loadTextContent('./logic-app/workflow.json')

var workflowDefinition = json(
  replace(
    replace(
      replace(workflowTemplate, '__SUB_ID__', subscription().subscriptionId),
      '__STORAGE_NAME__', storageAccountName
    ),
    '__NOTIFICATION_EMAIL__',
    notificationEmail
  )
)

resource logicApp 'Microsoft.Logic/workflows@2019-05-01' = {
  name: logicAppName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned, UserAssigned'
    userAssignedIdentities: { '${identity.id}': {} }
  }
  properties: {
    state: 'Enabled'
    definition: workflowDefinition
    parameters: {
      '$connections': {
        value: {
          azureblob: {
            connectionId: blobConnection.id
            connectionName: 'azureblob'
            id: subscriptionResourceId('Microsoft.Web/locations/managedApis', location, 'azureblob')
          }
          formrecognizer: {
            connectionId: documentIntelligenceConnection.id
            connectionName: 'formrecognizer'
            id: subscriptionResourceId('Microsoft.Web/locations/managedApis', location, 'formrecognizer')
          }
          outlook: {
            connectionId: outlookConnection.id
            connectionName: 'outlook'
            id: subscriptionResourceId('Microsoft.Web/locations/managedApis', location, 'outlook')
          }
        }
      }
    }
  }
}

// ──────────────────────────────────────────────
// RBAC — all via User-Assigned Managed Identity
// ──────────────────────────────────────────────

resource rbacStorageBlobContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, identity.id, 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
  scope: storageAccount
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
  }
}

resource rbacStorageBlobReader 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, identity.id, '2a2b9908-6ea1-4ae2-8e65-a410df84e7d1')
  scope: storageAccount
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '2a2b9908-6ea1-4ae2-8e65-a410df84e7d1')
  }
}

// ──────────────────────────────────────────────
// Outputs
// ──────────────────────────────────────────────

output STORAGE_ACCOUNT_NAME string = storageAccount.name
output FUNCTION_APP_NAME string = functionAppName
output LOGIC_APP_NAME string = logicAppName
output MANAGED_IDENTITY_CLIENT_ID string = identity.properties.clientId
output MANAGED_IDENTITY_PRINCIPAL_ID string = identity.properties.principalId
output APP_INSIGHTS_CONNECTION_STRING string = appInsights.properties.ConnectionString
output EVENT_GRID_SYSTEM_TOPIC_ID string = systemTopic.id
output KEY_VAULT_URI string = keyVault.properties.vaultUri
output DOCUMENT_INTELLIGENCE_ENDPOINT string = documentIntelligence.properties.endpoint
output DOCUMENT_INTELLIGENCE_NAME string = documentIntelligenceName
