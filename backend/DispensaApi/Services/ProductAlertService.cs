using DispensaApi.Data;
using DispensaApi.Models;
using Microsoft.EntityFrameworkCore;

namespace DispensaApi.Services;

public class ProductAlertService(AppDbContext db, NotificationService notifier)
{
    public async Task SendDailyAlertsAsync()
    {
        var groups = await db.FamilyGroups
            .Where(g => g.NotifyExpiring || g.NotifyLowStock)
            .Include(g => g.Products)
            .ToListAsync();

        foreach (var group in groups)
            await SendForGroupAsync(group);
    }

    public async Task SendAlertsForGroupAsync(Guid familyGroupId)
    {
        var group = await db.FamilyGroups
            .Include(g => g.Products)
            .FirstOrDefaultAsync(g => g.Id == familyGroupId);

        if (group != null)
            await SendForGroupAsync(group);
    }

    private async Task SendForGroupAsync(Models.FamilyGroup group)
    {
        var alerts = BuildAlerts(group.Products.ToList(), group.NotifyExpiring, group.NotifyLowStock);
        if (alerts.Count == 0) return;

        var body = string.Join(", ", alerts.Take(3));
        if (alerts.Count > 3) body += $" e mais {alerts.Count - 3}";

        await notifier.SendToGroupAsync(group.Id, $"🏡 Tem em Casa — {group.Name}", body);
    }

    private static List<string> BuildAlerts(List<Product> products, bool checkExpiry, bool checkLow)
    {
        var alerts = new List<string>();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        foreach (var p in products)
        {
            if (checkLow)
            {
                if (p.Quantity == 0) alerts.Add($"{p.Name}: sem estoque");
                else if (p.Quantity < p.MinQuantity) alerts.Add($"{p.Name}: estoque baixo");
            }
            if (checkExpiry && p.ExpiryDate.HasValue)
            {
                var diff = p.ExpiryDate.Value.DayNumber - today.DayNumber;
                if (diff < 0) alerts.Add($"{p.Name}: vencido");
                else if (diff <= 7) alerts.Add($"{p.Name}: vence em {diff}d");
            }
        }
        return alerts;
    }
}
