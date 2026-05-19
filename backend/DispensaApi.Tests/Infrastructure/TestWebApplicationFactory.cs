using DispensaApi.Data;
using DispensaApi.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DispensaApi.Tests.Infrastructure;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    // Each factory instance gets its own isolated in-memory database.
    private readonly string _dbName = $"TestDb_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, cfg) =>
            cfg.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"]      = "test-secret-key-at-least-32-characters!!",
                ["Jwt:Issuer"]      = "dispensa-test",
                ["Jwt:Audience"]    = "dispensa-test",
                ["Jwt:ExpiryHours"] = "24",
            }));

        builder.ConfigureServices(services =>
        {
            // Replace Npgsql DbContext with EF Core InMemory
            var dbOpts = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (dbOpts != null) services.Remove(dbOpts);
            services.AddDbContext<AppDbContext>(opt => opt.UseInMemoryDatabase(_dbName));

            // Replace real FirebaseService with testable fake
            var fbDescriptors = services.Where(d => d.ServiceType == typeof(IFirebaseService)).ToList();
            foreach (var d in fbDescriptors) services.Remove(d);
            services.AddSingleton<IFirebaseService, FakeFirebaseService>();

            // Remove DailyAlertJob — it sleeps for hours and has no value in tests
            var job = services.SingleOrDefault(d => d.ImplementationType == typeof(DailyAlertJob));
            if (job != null) services.Remove(job);
        });
    }
}
