using System.Net.Http.Json;
using System.Text.Json;

namespace DispensaApi.Tests.Infrastructure;

public class TestUser
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string FirebaseUid { get; set; } = "";
    public string Jwt { get; set; } = "";

    // Format consumed by FakeFirebaseService
    public string FakeToken => $"{FirebaseUid}|{Name}|{Email}";

    public static TestUser New(string name = "Test User") => new()
    {
        FirebaseUid = $"uid-{Guid.NewGuid():N}",
        Name = name,
        Email = $"{Guid.NewGuid():N}@test.com",
    };
}

public static class TestHelpers
{
    public static async Task<TestUser> LoginAsync(HttpClient client, string name = "Test User")
    {
        var user = TestUser.New(name);
        var resp = await client.PostAsJsonAsync("/api/auth/login", new { idToken = user.FakeToken });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        user.Jwt = body.GetProperty("token").GetString()!;
        user.UserId = Guid.Parse(body.GetProperty("user").GetProperty("id").GetString()!);
        return user;
    }

    // Builds an HttpRequestMessage with Authorization header and optional JSON body.
    public static HttpRequestMessage Req(HttpMethod method, string url, TestUser user, object? body = null)
    {
        var msg = new HttpRequestMessage(method, url);
        msg.Headers.Authorization = new("Bearer", user.Jwt);
        if (body != null)
            msg.Content = JsonContent.Create(body);
        return msg;
    }
}
