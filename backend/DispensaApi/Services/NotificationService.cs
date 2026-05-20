using FirebaseAdmin.Messaging;

namespace DispensaApi.Services;

public class NotificationService(ILogger<NotificationService> logger)
{
    public async Task SendToTokensAsync(IList<string> tokens, string title, string body)
    {
        if (tokens.Count == 0) return;

        var message = new MulticastMessage
        {
            Tokens = tokens.ToList(),
            Notification = new Notification { Title = title, Body = body },
            Android = new AndroidConfig
            {
                Notification = new AndroidNotification
                {
                    Sound = "default",
                    Icon = "ic_notification",
                }
            },
        };

        try
        {
            var response = await FirebaseMessaging.DefaultInstance.SendEachForMulticastAsync(message);
            logger.LogInformation("FCM sent {Success}/{Total}", response.SuccessCount, tokens.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "FCM send failed");
        }
    }
}
