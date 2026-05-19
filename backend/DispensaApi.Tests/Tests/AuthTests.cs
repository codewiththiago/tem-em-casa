using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DispensaApi.Tests.Infrastructure;
using Xunit;

namespace DispensaApi.Tests.Tests;

public class AuthTests(TestWebApplicationFactory factory) : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Health_Returns200WithOkStatus()
    {
        var resp = await _client.GetAsync("/api/auth/health");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("ok", body.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Login_NewUser_CreatesUserAndReturnsJwt()
    {
        var uid = $"uid-{Guid.NewGuid():N}";
        var resp = await _client.PostAsJsonAsync("/api/auth/login",
            new { idToken = $"{uid}|Alice|alice@test.com" });

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(string.IsNullOrEmpty(body.GetProperty("token").GetString()));
        Assert.Equal("Alice", body.GetProperty("user").GetProperty("name").GetString());
        Assert.Equal("alice@test.com", body.GetProperty("user").GetProperty("email").GetString());
    }

    [Fact]
    public async Task Login_SameFirebaseUid_ReturnsSameUserId()
    {
        var uid = $"uid-{Guid.NewGuid():N}";
        var fakeToken = $"{uid}|Bob|bob@test.com";

        var body1 = await LoginAndGetBody(fakeToken);
        var body2 = await LoginAndGetBody(fakeToken);

        var id1 = body1.GetProperty("user").GetProperty("id").GetString();
        var id2 = body2.GetProperty("user").GetProperty("id").GetString();
        Assert.Equal(id1, id2);
    }

    [Fact]
    public async Task Login_InvalidToken_Returns401()
    {
        var resp = await _client.PostAsJsonAsync("/api/auth/login", new { idToken = "invalid" });
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Login_NewUser_FamilyGroupIdIsNull()
    {
        var uid = $"uid-{Guid.NewGuid():N}";
        var body = await LoginAndGetBody($"{uid}|Carlos|carlos@test.com");
        var fgid = body.GetProperty("familyGroupId");
        Assert.Equal(JsonValueKind.Null, fgid.ValueKind);
    }

    private async Task<JsonElement> LoginAndGetBody(string fakeToken)
    {
        var resp = await _client.PostAsJsonAsync("/api/auth/login", new { idToken = fakeToken });
        resp.EnsureSuccessStatusCode();
        return await resp.Content.ReadFromJsonAsync<JsonElement>();
    }
}
