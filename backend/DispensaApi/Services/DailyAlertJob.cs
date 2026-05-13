namespace DispensaApi.Services;

public class DailyAlertJob(IServiceProvider services, ILogger<DailyAlertJob> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            var delay = GetDelayUntil8Am();
            logger.LogInformation("DailyAlertJob sleeping {Hours:F1}h until next run", delay.TotalHours);
            await Task.Delay(delay, ct);

            using var scope = services.CreateScope();
            var alertService = scope.ServiceProvider.GetRequiredService<ProductAlertService>();
            try
            {
                await alertService.SendDailyAlertsAsync();
                logger.LogInformation("DailyAlertJob completed at {Time}", DateTime.UtcNow);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "DailyAlertJob failed");
            }
        }
    }

    private static TimeSpan GetDelayUntil8Am()
    {
        var now = DateTime.Now;
        var next = now.Date.AddHours(8);
        if (now >= next) next = next.AddDays(1);
        return next - now;
    }
}
