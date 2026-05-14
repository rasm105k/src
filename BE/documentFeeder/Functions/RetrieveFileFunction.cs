using Azure.Storage.Blobs;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace DocumentFeeder.Functions;

public class RetrieveFileFunction
{
    private readonly ILogger _logger;

    public RetrieveFileFunction(ILoggerFactory loggerFactory)
    {
        _logger = loggerFactory.CreateLogger<RetrieveFileFunction>();
    }

    [Function("retrieveFile")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Function, "get", Route = "files/{fileName?}")] HttpRequestData req,
        string? fileName)
    {
        fileName ??= req.Query["fileName"];

        if (string.IsNullOrWhiteSpace(fileName))
        {
            var badResponse = req.CreateResponse(System.Net.HttpStatusCode.BadRequest);
            await badResponse.WriteAsJsonAsync(new { error = "Missing required parameter: fileName" });
            return badResponse;
        }

        var source = req.Query["source"];
        var containerName = req.Query["container"];

        var sanitized = Path.GetFileName(fileName);
        if (string.IsNullOrEmpty(sanitized) || sanitized.Contains(".."))
        {
            var badResponse = req.CreateResponse(System.Net.HttpStatusCode.BadRequest);
            await badResponse.WriteAsJsonAsync(new { error = "Invalid file name" });
            return badResponse;
        }

        try
        {
            byte[] content;
            string contentType;

            if (string.Equals(source, "blob", StringComparison.OrdinalIgnoreCase))
            {
                (content, contentType) = await GetFromBlobAsync(sanitized, containerName);
            }
            else
            {
                (content, contentType) = await GetFromLocalAsync(sanitized);
            }

            var response = req.CreateResponse(System.Net.HttpStatusCode.OK);
            response.Headers.Add("Content-Type", contentType);
            response.Headers.Add("Content-Disposition", $"inline; filename=\"{sanitized}\"");
            await response.Body.WriteAsync(content);
            return response;
        }
        catch (FileNotFoundException)
        {
            var notFound = req.CreateResponse(System.Net.HttpStatusCode.NotFound);
            await notFound.WriteAsJsonAsync(new { error = $"File '{sanitized}' not found" });
            return notFound;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve file '{FileName}'", sanitized);
            var errorResponse = req.CreateResponse(System.Net.HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new { error = $"Failed to retrieve file: {ex.Message}" });
            return errorResponse;
        }
    }

    private static async Task<(byte[] Content, string ContentType)> GetFromLocalAsync(string fileName)
    {
        var storagePath = Environment.GetEnvironmentVariable("FILE_STORAGE_PATH") ?? "files";
        var filePath = Path.GetFullPath(Path.Combine(storagePath, fileName));

        if (!File.Exists(filePath))
            throw new FileNotFoundException($"File '{fileName}' not found at {filePath}");

        var content = await File.ReadAllBytesAsync(filePath);
        var contentType = GetContentType(fileName);

        return (content, contentType);
    }

    private static async Task<(byte[] Content, string ContentType)> GetFromBlobAsync(string fileName, string? containerName)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("STORAGE_CONNECTION_STRING")
            ?? Environment.GetEnvironmentVariable("AzureWebJobsStorage");

        if (string.IsNullOrEmpty(connectionString))
            throw new InvalidOperationException("No storage connection string configured. Set STORAGE_CONNECTION_STRING or AzureWebJobsStorage.");

        var container = containerName ?? "documents";
        var blobServiceClient = new BlobServiceClient(connectionString);
        var containerClient = blobServiceClient.GetBlobContainerClient(container);
        var blobClient = containerClient.GetBlobClient(fileName);

        var exists = await blobClient.ExistsAsync();
        if (!exists.Value)
            throw new FileNotFoundException($"Blob '{container}/{fileName}' not found");

        var downloadResponse = await blobClient.DownloadContentAsync();
        var content = downloadResponse.Value.Content.ToArray();
        var contentType = GetContentType(fileName);

        return (content, contentType);
    }

    private static string GetContentType(string fileName)
    {
        var ext = Path.GetExtension(fileName)?.ToLowerInvariant();

        return ext switch
        {
            ".pdf" => "application/pdf",
            ".txt" => "text/plain",
            ".json" => "application/json",
            ".csv" => "text/csv",
            ".xml" => "application/xml",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".md" => "text/markdown",
            ".html" or ".htm" => "text/html",
            ".zip" => "application/zip",
            _ => "application/octet-stream",
        };
    }
}
