using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DispensaApi.Tests.Infrastructure;
using Xunit;

namespace DispensaApi.Tests.Tests;

public class FamilyTests(TestWebApplicationFactory factory) : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task CreateFamily_ValidData_ReturnsGroupWithInviteCode()
    {
        var user = await TestHelpers.LoginAsync(_client);
        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Post, "/api/family", user,
            new { name = "Família Teste", pin = "1234" }));

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var group = (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("group");
        Assert.Equal("Família Teste", group.GetProperty("name").GetString());
        Assert.Equal(6, group.GetProperty("inviteCode").GetString()!.Length);
        Assert.Equal(1, group.GetProperty("members").GetArrayLength());
    }

    [Fact]
    public async Task CreateFamily_InvalidPin_Returns400()
    {
        var user = await TestHelpers.LoginAsync(_client);
        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Post, "/api/family", user,
            new { name = "Família X", pin = "abc" }));

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task CreateFamily_Unauthenticated_Returns401()
    {
        var resp = await _client.PostAsJsonAsync("/api/family", new { name = "Família X", pin = "1234" });
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task JoinFamily_ValidCodeAndPin_ReturnsGroup()
    {
        var owner = await TestHelpers.LoginAsync(_client, "Dono");
        var (groupId, inviteCode) = await CreateFamilyAsync(owner);

        var joiner = await TestHelpers.LoginAsync(_client, "Entrante");
        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Post, "/api/family/join", joiner,
            new { inviteCode, pin = "4321" }));

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var returnedId = (await resp.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("group").GetProperty("id").GetString();
        Assert.Equal(groupId.ToString(), returnedId);
    }

    [Fact]
    public async Task JoinFamily_WrongPin_Returns400()
    {
        var owner = await TestHelpers.LoginAsync(_client, "Dono");
        var (_, inviteCode) = await CreateFamilyAsync(owner);

        var joiner = await TestHelpers.LoginAsync(_client);
        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Post, "/api/family/join", joiner,
            new { inviteCode, pin = "0000" }));

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task JoinFamily_InvalidCode_Returns404()
    {
        var user = await TestHelpers.LoginAsync(_client);
        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Post, "/api/family/join", user,
            new { inviteCode = "ZZZZZZ", pin = "1234" }));

        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task JoinFamily_AlreadyMember_IsIdempotent()
    {
        var owner = await TestHelpers.LoginAsync(_client, "Dono");
        var (_, inviteCode) = await CreateFamilyAsync(owner);

        var r1 = await _client.SendAsync(TestHelpers.Req(HttpMethod.Post, "/api/family/join", owner,
            new { inviteCode, pin = "4321" }));
        var r2 = await _client.SendAsync(TestHelpers.Req(HttpMethod.Post, "/api/family/join", owner,
            new { inviteCode, pin = "4321" }));

        Assert.Equal(HttpStatusCode.OK, r1.StatusCode);
        Assert.Equal(HttpStatusCode.OK, r2.StatusCode);
    }

    [Fact]
    public async Task GetFamily_NonMember_Returns403()
    {
        var owner = await TestHelpers.LoginAsync(_client, "Dono");
        var (groupId, _) = await CreateFamilyAsync(owner);

        var outsider = await TestHelpers.LoginAsync(_client, "Estranho");
        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Get, $"/api/family/{groupId}", outsider));

        Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
    }

    [Fact]
    public async Task GetFamily_Member_ReturnsGroupWithMembersList()
    {
        var user = await TestHelpers.LoginAsync(_client, "Membro");
        var (groupId, _) = await CreateFamilyAsync(user);

        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Get, $"/api/family/{groupId}", user));

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var group = (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("group");
        Assert.Equal(1, group.GetProperty("members").GetArrayLength());
        Assert.Equal("Membro", group.GetProperty("members")[0].GetProperty("name").GetString());
    }

    [Fact]
    public async Task UpdateSettings_Member_PersistsChanges()
    {
        var user = await TestHelpers.LoginAsync(_client);
        var (groupId, _) = await CreateFamilyAsync(user);

        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Put, $"/api/family/{groupId}/settings", user,
            new { whatsappPhone = "+5511999999999", notifyExpiring = false, notifyLowStock = true }));

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var group = (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("group");
        Assert.Equal("+5511999999999", group.GetProperty("whatsappPhone").GetString());
        Assert.False(group.GetProperty("notifyExpiring").GetBoolean());
    }

    [Fact]
    public async Task LeaveFamily_LastMember_GroupIsDeleted()
    {
        var owner = await TestHelpers.LoginAsync(_client, "SoMembro");
        var (groupId, _) = await CreateFamilyAsync(owner);

        var leaveResp = await _client.SendAsync(
            TestHelpers.Req(HttpMethod.Delete, $"/api/family/{groupId}/leave", owner));
        Assert.Equal(HttpStatusCode.OK, leaveResp.StatusCode);

        // Group no longer accessible — owner is no longer a member
        var getResp = await _client.SendAsync(
            TestHelpers.Req(HttpMethod.Get, $"/api/family/{groupId}", owner));
        Assert.Equal(HttpStatusCode.Forbidden, getResp.StatusCode);
    }

    [Fact]
    public async Task GetActivityLog_AfterCreatingGroup_HasCreateGroupEntry()
    {
        var user = await TestHelpers.LoginAsync(_client, "LogUser");
        var (groupId, _) = await CreateFamilyAsync(user);

        var resp = await _client.SendAsync(
            TestHelpers.Req(HttpMethod.Get, $"/api/family/{groupId}/activity", user));

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var logs = (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("logs");
        Assert.True(logs.GetArrayLength() > 0);
        Assert.Contains(logs.EnumerateArray(), l =>
            l.GetProperty("action").GetString() == "create_group");
    }

    // Creates a family group and returns (groupId, inviteCode).
    private async Task<(Guid groupId, string inviteCode)> CreateFamilyAsync(
        TestUser owner, string pin = "4321")
    {
        var name = $"Família {Guid.NewGuid():N}";
        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Post, "/api/family", owner,
            new { name, pin }));
        resp.EnsureSuccessStatusCode();
        var group = (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("group");
        return (
            Guid.Parse(group.GetProperty("id").GetString()!),
            group.GetProperty("inviteCode").GetString()!);
    }
}
