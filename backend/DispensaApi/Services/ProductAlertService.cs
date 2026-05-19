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

        if (groups.Count == 0) return;

        // Load all FCM tokens for all relevant groups in a single query instead of N queries.
        var groupIds = groups.Select(g => g.Id).ToList();
        var tokensByGroup = await db.FamilyMembers
            .Where(m => groupIds.Contains(m.FamilyGroupId))
            .Join(db.Users, m => m.UserId, u => u.Id, (m, u) => new { m.FamilyGroupId, u.FcmToken })
            .Where(x => x.FcmToken != null)
            .GroupBy(x => x.FamilyGroupId)
            .ToDictionaryAsync(g => g.Key, g => g.Select(x => x.FcmToken!).ToList());

        foreach (var group in groups)
        {
            var tokens = tokensByGroup.GetValueOrDefault(group.Id, []);
            await SendForGroupAsync(group, tokens);
        }
    }

    public async Task SendAlertsForGroupAsync(Guid familyGroupId)
    {
        var group = await db.FamilyGroups
            .Include(g => g.Products)
            .FirstOrDefaultAsync(g => g.Id == familyGroupId);

        if (group == null) return;

        var tokens = await db.FamilyMembers
            .Where(m => m.FamilyGroupId == familyGroupId)
            .Join(db.Users, m => m.UserId, u => u.Id, (m, u) => u.FcmToken)
            .Where(t => t != null)
            .Select(t => t!)
            .ToListAsync();

        await SendForGroupAsync(group, tokens);
    }

    private async Task SendForGroupAsync(FamilyGroup group, IList<string> tokens)
    {
        var alerts = BuildAlerts(group.Products.ToList(), group.NotifyExpiring, group.NotifyLowStock);
        if (alerts.Count == 0 || tokens.Count == 0) return;

        var body = string.Join(", ", alerts.Take(3));
        if (alerts.Count > 3) body += $" e mais {alerts.Count - 3}";

        await notifier.SendToTokensAsync(tokens, $"🏡 Tem em Casa — {group.Name}", body);
    }

    private static List<string> BuildAlerts(List<Product> products, bool checkExpiry, bool checkLow)
    {
        var alerts = new List<string>();
        var today = LocalTime.Today();

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
