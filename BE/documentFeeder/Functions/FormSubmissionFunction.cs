using System.Text.Json;
using Azure.Messaging.ServiceBus;
using Azure.Storage.Blobs;
using DocumentFeeder.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace DocumentFeeder.Functions;

public class FormSubmissionFunction
{
    private readonly ILogger _logger;

    public FormSubmissionFunction(ILoggerFactory loggerFactory)
    {
        _logger = loggerFactory.CreateLogger<FormSubmissionFunction>();
    }

    [Function("submitForm")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Function, "post", Route = "submit")] HttpRequest req)
    {
        try
        {
            if (!req.HasFormContentType)
            {
                return new BadRequestObjectResult(new { error = "Request must be multipart/form-data" });
            }

            var formData = await req.ReadFormAsync();
            var file = formData.Files?.FirstOrDefault();

            if (file == null)
            {
                return new BadRequestObjectResult(new { error = "No file uploaded. Include a file in the multipart form data." });
            }

            var submission = new FormSubmission
            {
                CustomerName = formData.TryGetValue("customerName", out var n) ? n.ToString() : null,
                CustomerEmail = formData.TryGetValue("customerEmail", out var e) ? e.ToString() : null,
                CustomerPhone = formData.TryGetValue("customerPhone", out var p) ? p.ToString() : null,
                ProjectName = formData.TryGetValue("projectName", out var pn) ? pn.ToString() : null,
                Description = formData.TryGetValue("description", out var d) ? d.ToString() : null,
            };

            var metadataStr = formData.TryGetValue("metadata", out var m) ? m.ToString() : null;
            if (!string.IsNullOrEmpty(metadataStr))
            {
                try
                {
                    submission.Metadata = JsonSerializer.Deserialize<Dictionary<string, string>>(metadataStr);
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Failed to parse metadata JSON");
                }
            }

            var submissionId = Guid.NewGuid().ToString("N");
            var now = DateTime.UtcNow;
            var datePrefix = now.ToString("yyyy/MM/dd");
            var blobName = $"{datePrefix}/{submissionId}_{file.FileName}";

            var connectionString =
                Environment.GetEnvironmentVariable("STORAGE_CONNECTION_STRING")
                ?? Environment.GetEnvironmentVariable("AzureWebJobsStorage");

            if (string.IsNullOrEmpty(connectionString))
            {
                return new ObjectResult(new { error = "Storage not configured" }) { StatusCode = 500 };
            }

            var containerName = Environment.GetEnvironmentVariable("UPLOAD_CONTAINER") ?? "uploads";
            var blobServiceClient = new BlobServiceClient(connectionString);
            var containerClient = blobServiceClient.GetBlobContainerClient(containerName);
            await containerClient.CreateIfNotExistsAsync();

            var blobClient = containerClient.GetBlobClient(blobName);

            await using var fileStream = file.OpenReadStream();
            await blobClient.UploadAsync(fileStream, overwrite: false);

            var fileUrl = blobClient.Uri.ToString();

            var message = new DocumentSubmissionMessage
            {
                SubmissionId = submissionId,
                FileName = file.FileName,
                FileUrl = fileUrl,
                ContentType = file.ContentType ?? "application/octet-stream",
                FileSize = file.Length,
                ContainerName = containerName,
                BlobName = blobName,
                SubmittedAt = now,
                CustomerName = submission.CustomerName,
                CustomerEmail = submission.CustomerEmail,
                CustomerPhone = submission.CustomerPhone,
                ProjectName = submission.ProjectName,
                Description = submission.Description,
                Metadata = submission.Metadata,
            };

            await EnqueueMessageAsync(message);

            _logger.LogInformation("Form submitted: {SubmissionId}, file: {FileName}", submissionId, file.FileName);

            return new OkObjectResult(new
            {
                submissionId,
                fileUrl,
                fileName = file.FileName,
                fileSize = file.Length,
                submittedAt = now,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Form submission failed");
            return new ObjectResult(new { error = $"Submission failed: {ex.Message}" }) { StatusCode = 500 };
        }
    }

    private static async Task EnqueueMessageAsync(DocumentSubmissionMessage message)
    {
        var sbConnectionString = Environment.GetEnvironmentVariable("SERVICEBUS_CONNECTION_STRING");
        var queueName = Environment.GetEnvironmentVariable("SERVICEBUS_QUEUE_NAME") ?? "documents-to-process";

        if (string.IsNullOrEmpty(sbConnectionString))
        {
            return;
        }

        var client = new ServiceBusClient(sbConnectionString);
        var sender = client.CreateSender(queueName);

        var body = JsonSerializer.Serialize(message);
        var sbMessage = new ServiceBusMessage(body)
        {
            MessageId = message.SubmissionId,
            ContentType = "application/json",
        };

        await sender.SendMessageAsync(sbMessage);
    }
}
