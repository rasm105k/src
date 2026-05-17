using System.Data;
using Microsoft.Data.SqlClient;

namespace DocumentApi.Data;

public interface ISqlConnectionFactory
{
    Task<IDbConnection> OpenConnectionAsync(CancellationToken cancellationToken);
}

public sealed class SqlConnectionFactory(IConfiguration configuration) : ISqlConnectionFactory
{
    public async Task<IDbConnection> OpenConnectionAsync(CancellationToken cancellationToken)
    {
        var connectionString = configuration.GetConnectionString("WorkslipDb")
            ?? configuration["Sql:ConnectionString"]
            ?? throw new InvalidOperationException("Missing WorkslipDb connection string.");

        var connection = new SqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        return connection;
    }
}
