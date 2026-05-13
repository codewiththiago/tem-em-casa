using FirebaseAdmin.Messaging;
using DispensaApi.Data;
using Microsoft.EntityFrameworkCore;

namespace DispensaApi.Services;

public class NotificationService(AppDbContext db, ILogger<NotificationService> logger)
{
    public async Task SendToGroupAsync(Guid familyGroupId, string title, string body)
    {
        var tokens = await db.FamilyMembers
            .Where(m => m.FamilyGroupId == familyGroupId)
            .Join(db.Users, m => m.UserId, u => u.Id, (m, u) => u.FcmToken)
            .Where(t => t != null)
            .ToListAsync();

        if (tokens.Count == 0) return;

        var message = new MulticastMessage
        {
            Tokens = tokens!,
            Notification = new Notification { Title = title, Body = body },
            Android = new AndroidConfig
            {
                Notification = new AndroidNotification { Sound = "default" }
            },
        };

        try
        {
            var response = await FirebaseMessaging.DefaultInstance.SendEachForMulticastAsync(message);
            logger.LogInformation("FCM sent {Success}/{Total} for group {GroupId}",
                response.SuccessCount, tokens.Count, familyGroupId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "FCM send failed for group {GroupId}", familyGroupId);
        }
    }
}
