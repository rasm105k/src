param location string = resourceGroup().location
param environment string = 'dev'
param functionAppName string = 'func-docfeeder-${environment}'
param storageAccountName string = 'stdocfeeder${environment}'
param logicAppName string = 'la-docprocessor-${environment}'
param appInsightsName string = 'ai-docfeeder-${environment}'
param logAnalyticsName string = 'la-docfeeder-${environment}'
param identityName string = 'id-docfeeder-${environment}'

var tags = {
  environment: environment
  project: 'document-feeder'
}

// ──────────────────────────────────────────────
// Monitoring
// ──────────────────────────────────────────────

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
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
    IngestionMode: 'LogAnalytics'
  }
}

// ──────────────────────────────────────────────
// Identity
// ──────────────────────────────────────────────

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
  tags: tags
}

// ──────────────────────────────────────────────
// Storage
// ──────────────────────────────────────────────

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: { name: 'Standard_LRS' }
  tags: tags
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource uploadsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/uploads'
}

resource documentsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/documents'
}

// ──────────────────────────────────────────────
// Function App (Consumption Plan, Linux, .NET)
// ──────────────────────────────────────────────

resource hostingPlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: 'asp-docfeeder-${environment}'
  location: location
  kind: 'linux'
  sku: { name: 'Y1', tier: 'Dynamic' }
  tags: tags
  properties: { reserved: true }
}

resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
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
      linuxFxVersion: 'DOTNET-ISOLATED|10.0'
      alwaysOn: false
      use32BitWorkerProcess: false
      appSettings: [
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'dotnet-isolated' }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'AzureWebJobsStorage__accountName', value: storageAccount.name }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        { name: 'UPLOAD_CONTAINER', value: 'uploads' }
        { name: 'STORAGE_ACCOUNT_NAME', value: storageAccount.name }
        { name: 'AZURE_CLIENT_ID', value: identity.properties.clientId }
      ]
    }
    clientAffinityEnabled: false
  }
}

// ──────────────────────────────────────────────
// Event Grid System Topic (for Storage events)
// ──────────────────────────────────────────────

resource systemTopic 'Microsoft.EventGrid/systemTopics@2022-06-15' = {
  name: 'eg-docfeeder-${environment}'
  location: location
  tags: tags
  properties: {
    source: storageAccount.id
    topicType: 'Microsoft.Storage.StorageAccounts'
  }
}

// ──────────────────────────────────────────────
// API Connections (shared by Logic App)
// ──────────────────────────────────────────────

resource blobConnection 'Microsoft.Web/connections@2016-06-01' = {
  name: 'as-docfeeder-blob-${environment}'
  location: location
  tags: tags
  properties: {
    displayName: 'Blob Connection'
    api: { id: subscriptionResourceId('Microsoft.Web/locations/${location}/managedApis', 'azureblob') }
    parameterValueType: 'Alternative'
    parameterValues: {
      authType: 'ManagedServiceIdentity'
      identityId: identity.id
    }
  }
}

resource eventGridConnection 'Microsoft.Web/connections@2016-06-01' = {
  name: 'as-docfeeder-eg-${environment}'
  location: location
  tags: tags
  properties: {
    displayName: 'Event Grid Connection'
    api: { id: subscriptionResourceId('Microsoft.Web/locations/${location}/managedApis', 'azureeventgrid') }
    parameterValueType: 'Alternative'
    parameterValues: {
      authType: 'ManagedServiceIdentity'
      identityId: identity.id
    }
  }
}

// ──────────────────────────────────────────────
// Logic App (Consumption, Event Grid trigger)
// ──────────────────────────────────────────────

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
    definition: {
      '$schema': 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#'
      contentVersion: '1.0.0.0'
      parameters: {
        '$connections': {
          defaultValue: {}
          type: 'Object'
        }
      }
      triggers: {
        When_a_resource_event_occurs: {
          type: 'ApiConnection'
          inputs: {
            host: {
              connection: {
                name: '@parameters(''$connections'')[''azureeventgrid''][''connectionId'']'
              }
            }
            method: 'post'
            path: '/subscriptions/@encodeURIComponent(''${subscription().subscriptionId}'')/providers/@encodeURIComponent(''Microsoft.Storage.StorageAccounts'')/resource/@encodeURIComponent(''${storageAccountName}'')/events/@encodeURIComponent(''Microsoft.Storage.BlobCreated'')'
          }
          recurrence: {
            frequency: 'Minute'
            interval: 1
          }
        }
      }
      actions: {
        Get_blob_content: {
          type: 'ApiConnection'
          inputs: {
            host: {
              connection: {
                name: '@parameters(''$connections'')[''azureblob''][''connectionId'']'
              }
            }
            method: 'get'
            path: '/datasets/default/GetFileByPath'
            queries: {
              path: '@{triggerOutputs()?[''body''][''subject'']}'
            }
          }
          runAfter: {}
        }
      }
      outputs: {}
    }
    parameters: {
      '$connections': {
        value: {
          azureblob: {
            connectionId: blobConnection.id
            connectionName: 'azureblob'
            id: subscriptionResourceId('Microsoft.Web/locations/${location}/managedApis', 'azureblob')
          }
          azureeventgrid: {
            connectionId: eventGridConnection.id
            connectionName: 'azureeventgrid'
            id: subscriptionResourceId('Microsoft.Web/locations/${location}/managedApis', 'azureeventgrid')
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
