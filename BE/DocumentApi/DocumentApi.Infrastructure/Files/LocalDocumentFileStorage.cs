using System.Buffers;
using System.Security.Cryptography;
using DocumentApi.Documents;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace DocumentApi.Infrastructure.Files;

public sealed class LocalDocumentFileStorage(IConfiguration configuration, IHostEnvironment environment) : IDocumentFileStorage
{
    private const string DefaultStorageAccountName = "localdevstore";
    private const string DefaultContainerName = "report-attachments";
    private static readonly char[] InvalidFileNameChars = Path.GetInvalidFileNameChars();

    private readonly string rootPath = ResolveRootPath(
        configuration["DocumentFileStorage:LocalRootPath"] ?? "UploadedFiles",
        environment.ContentRootPath);

    private readonly string storageAccountName =
        configuration["DocumentFileStorage:StorageAccountName"] ?? DefaultStorageAccountName;

    private readonly string containerName =
        configuration["DocumentFileStorage:ContainerName"] ?? DefaultContainerName;

    public async Task<StoredDocumentFile> SaveAsync(
        Guid reportId,
        Stream content,
        string fileName,
        string? contentType,
        CancellationToken cancellationToken)
    {
        var safeFileName = SafeFileName(fileName);
        var blobName = $"reports/{reportId:N}/{DateTimeOffset.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}-{safeFileName}";
        var fullPath = ResolvePath(containerName, blobName);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await using var target = new FileStream(
            fullPath,
            FileMode.CreateNew,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 81920,
            useAsync: true);

        using var sha256 = SHA256.Create();
        var buffer = ArrayPool<byte>.Shared.Rent(81920);
        long totalBytes = 0;

        try
        {
            while (true)
            {
                var read = await content.ReadAsync(buffer.AsMemory(0, buffer.Length), cancellationToken);
                if (read == 0)
                {
                    break;
                }

                await target.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
                sha256.TransformBlock(buffer, 0, read, null, 0);
                totalBytes += read;
            }

            sha256.TransformFinalBlock([], 0, 0);
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(buffer);
        }

        return new StoredDocumentFile(
            storageAccountName,
            containerName,
            blobName,
            BlobVersionId: null,
            safeFileName,
            string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType,
            totalBytes,
            Convert.ToHexString(sha256.Hash!).ToLowerInvariant());
    }

    public Task<StoredDocumentFileContent?> OpenReadAsync(DocumentFileResponse file, CancellationToken cancellationToken)
    {
        if (!string.Equals(file.StorageAccountName, storageAccountName, StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult<StoredDocumentFileContent?>(null);
        }

        var fullPath = ResolvePath(file.ContainerName, file.BlobName);
        if (!File.Exists(fullPath))
        {
            return Task.FromResult<StoredDocumentFileContent?>(null);
        }

        Stream stream = new FileStream(
            fullPath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 81920,
            useAsync: true);

        return Task.FromResult<StoredDocumentFileContent?>(new(stream, file.FileName, file.ContentType));
    }

    private string ResolvePath(string container, string blobName)
    {
        var containerRoot = Path.GetFullPath(Path.Combine(rootPath, SafeFileName(container)));
        var relativeBlobPath = blobName
            .Replace('/', Path.DirectorySeparatorChar)
            .Replace('\\', Path.DirectorySeparatorChar);
        var fullPath = Path.GetFullPath(Path.Combine(containerRoot, relativeBlobPath));

        if (!fullPath.StartsWith(containerRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Blob path resolves outside the configured upload root.");
        }

        return fullPath;
    }

    private static string SafeFileName(string value)
    {
        var candidate = Path.GetFileName(value);
        if (string.IsNullOrWhiteSpace(candidate))
        {
            return "upload.bin";
        }

        foreach (var invalid in InvalidFileNameChars)
        {
            candidate = candidate.Replace(invalid, '_');
        }

        return candidate.Trim();
    }

    private static string ResolveRootPath(string configuredPath, string contentRootPath) =>
        Path.GetFullPath(Path.IsPathRooted(configuredPath)
            ? configuredPath
            : Path.Combine(contentRootPath, configuredPath));
}
