using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DispensaApi.Tests.Infrastructure;
using Xunit;

namespace DispensaApi.Tests.Tests;

public class ProductTests(TestWebApplicationFactory factory) : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task ListProducts_NewFamily_ReturnsEmptyList()
    {
        var (user, familyId) = await SetupAsync();
        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Get, ProductsUrl(familyId), user));

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, body.GetProperty("products").GetArrayLength());
    }

    [Fact]
    public async Task CreateProduct_ValidData_ReturnsDto()
    {
        var (user, familyId) = await SetupAsync();
        var resp = await CreateProductAsync(user, familyId, "Arroz",
            quantity: 2, min: 1, max: 5);

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var product = (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("product");
        Assert.Equal("Arroz", product.GetProperty("name").GetString());
        Assert.Equal(2m, product.GetProperty("quantity").GetDecimal());
    }

    [Fact]
    public async Task CreateProduct_MinGreaterThanMax_Returns400()
    {
        var (user, familyId) = await SetupAsync();
        var resp = await CreateProductAsync(user, familyId, "Óleo",
            quantity: 0, min: 5, max: 2);

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task CreateProduct_NonMember_Returns403()
    {
        var (_, familyId) = await SetupAsync("Dono");
        var outsider = await TestHelpers.LoginAsync(_client, "Estranho");

        var resp = await CreateProductAsync(outsider, familyId, "Sal");
        Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
    }

    [Fact]
    public async Task ListProducts_ReturnsOrderedByName()
    {
        var (user, familyId) = await SetupAsync();
        await CreateProductAsync(user, familyId, "Macarrão");
        await CreateProductAsync(user, familyId, "Arroz");
        await CreateProductAsync(user, familyId, "Feijão");

        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Get, ProductsUrl(familyId), user));
        var products = (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("products");

        Assert.Equal("Arroz",    products[0].GetProperty("name").GetString());
        Assert.Equal("Feijão",   products[1].GetProperty("name").GetString());
        Assert.Equal("Macarrão", products[2].GetProperty("name").GetString());
    }

    [Fact]
    public async Task UpdateProduct_ValidData_ReturnsUpdatedDto()
    {
        var (user, familyId) = await SetupAsync();
        var productId = await CreateProductAndGetIdAsync(user, familyId, "Macarrão");

        var resp = await _client.SendAsync(TestHelpers.Req(
            HttpMethod.Put, $"{ProductsUrl(familyId)}/{productId}", user,
            new { name = "Macarrão Integral", category = "Alimentos", location = "Armário",
                  quantity = 3, minQuantity = 1, maxQuantity = 10, unit = "un" }));

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var product = (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("product");
        Assert.Equal("Macarrão Integral", product.GetProperty("name").GetString());
        Assert.Equal(3m, product.GetProperty("quantity").GetDecimal());
    }

    [Fact]
    public async Task DeleteProduct_ExistingProduct_RemovesFromList()
    {
        var (user, familyId) = await SetupAsync();
        var productId = await CreateProductAndGetIdAsync(user, familyId, "Feijão");

        var deleteResp = await _client.SendAsync(
            TestHelpers.Req(HttpMethod.Delete, $"{ProductsUrl(familyId)}/{productId}", user));
        Assert.Equal(HttpStatusCode.OK, deleteResp.StatusCode);

        var listResp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Get, ProductsUrl(familyId), user));
        var products = (await listResp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("products");
        Assert.Equal(0, products.GetArrayLength());
    }

    [Fact]
    public async Task DeleteProduct_NonMember_Returns403()
    {
        var (owner, familyId) = await SetupAsync("Dono");
        var productId = await CreateProductAndGetIdAsync(owner, familyId, "Sal");

        var outsider = await TestHelpers.LoginAsync(_client, "Estranho");
        var resp = await _client.SendAsync(
            TestHelpers.Req(HttpMethod.Delete, $"{ProductsUrl(familyId)}/{productId}", outsider));
        Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
    }

    [Fact]
    public async Task GetAlerts_LowStock_ReturnsProduct()
    {
        var (user, familyId) = await SetupAsync();
        // quantity=0 < minQuantity=2 → low stock alert
        await CreateProductAsync(user, familyId, "Açúcar", quantity: 0, min: 2, max: 5);

        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Get, ProductsUrl(familyId, "alerts"), user));
        var products = (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("products");
        Assert.True(products.GetArrayLength() > 0);
        Assert.Equal("Açúcar", products[0].GetProperty("name").GetString());
    }

    [Fact]
    public async Task GetAlerts_SufficientStock_ReturnsEmpty()
    {
        var (user, familyId) = await SetupAsync();
        // quantity=5 >= minQuantity=2 — no alert expected
        await CreateProductAsync(user, familyId, "Café", quantity: 5, min: 2, max: 10);

        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Get, ProductsUrl(familyId, "alerts"), user));
        var products = (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("products");
        Assert.Equal(0, products.GetArrayLength());
    }

    [Fact]
    public async Task GetAlerts_ExpiringIn7Days_ReturnsProduct()
    {
        var (user, familyId) = await SetupAsync();
        var expiryDate = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(7).ToString("yyyy-MM-dd");
        await CreateProductAsync(user, familyId, "Leite",
            quantity: 5, min: 1, max: 10, expiryDate: expiryDate);

        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Get, ProductsUrl(familyId, "alerts"), user));
        var products = (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("products");
        Assert.True(products.GetArrayLength() > 0);
    }

    [Fact]
    public async Task GetAlerts_ExpiringIn8Days_DoesNotReturn()
    {
        var (user, familyId) = await SetupAsync();
        var expiryDate = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(8).ToString("yyyy-MM-dd");
        await CreateProductAsync(user, familyId, "Iogurte",
            quantity: 5, min: 1, max: 10, expiryDate: expiryDate);

        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Get, ProductsUrl(familyId, "alerts"), user));
        var products = (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("products");
        Assert.Equal(0, products.GetArrayLength());
    }

    [Fact]
    public async Task GetShopping_BelowMinimum_ReturnsCorrectToBuyAmount()
    {
        var (user, familyId) = await SetupAsync();
        // quantity=1, min=3, max=10 → ToBuy = max(1, 10-1) = 9
        await CreateProductAsync(user, familyId, "Azeite", quantity: 1, min: 3, max: 10);

        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Get, ProductsUrl(familyId, "shopping"), user));
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var items = (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("items");
        Assert.Equal(1, items.GetArrayLength());
        Assert.Equal(9m, items[0].GetProperty("toBuy").GetDecimal());
        Assert.False(items[0].GetProperty("urgent").GetBoolean());
    }

    [Fact]
    public async Task GetShopping_ZeroQuantity_MarkedAsUrgent()
    {
        var (user, familyId) = await SetupAsync();
        await CreateProductAsync(user, familyId, "Detergente", quantity: 0, min: 2, max: 5);

        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Get, ProductsUrl(familyId, "shopping"), user));
        var items = (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("items");
        Assert.Equal(1, items.GetArrayLength());
        Assert.True(items[0].GetProperty("urgent").GetBoolean());
    }

    [Fact]
    public async Task GetShopping_AboveMinimum_NotReturned()
    {
        var (user, familyId) = await SetupAsync();
        // quantity=10 >= min=3 → not in shopping list
        await CreateProductAsync(user, familyId, "Papel Higiênico", quantity: 10, min: 3, max: 12);

        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Get, ProductsUrl(familyId, "shopping"), user));
        var items = (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("items");
        Assert.Equal(0, items.GetArrayLength());
    }

    // --- Helpers ---

    private async Task<(TestUser user, Guid familyId)> SetupAsync(string userName = "User")
    {
        var user = await TestHelpers.LoginAsync(_client, userName);
        var resp = await _client.SendAsync(TestHelpers.Req(HttpMethod.Post, "/api/family", user,
            new { name = $"Família {Guid.NewGuid():N}", pin = "1234" }));
        resp.EnsureSuccessStatusCode();
        var groupId = Guid.Parse(
            (await resp.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("group").GetProperty("id").GetString()!);
        return (user, groupId);
    }

    private static string ProductsUrl(Guid familyId, string? sub = null) =>
        $"/api/family/{familyId}/products{(sub != null ? $"/{sub}" : "")}";

    private async Task<HttpResponseMessage> CreateProductAsync(
        TestUser user, Guid familyId, string name,
        decimal quantity = 2, decimal min = 1, decimal max = 5,
        string? expiryDate = null)
    {
        return await _client.SendAsync(TestHelpers.Req(HttpMethod.Post, ProductsUrl(familyId), user, new
        {
            name,
            category    = "Alimentos",
            location    = "Armário",
            quantity,
            minQuantity = min,
            maxQuantity = max,
            unit        = "un",
            expiryDate,
        }));
    }

    private async Task<Guid> CreateProductAndGetIdAsync(
        TestUser user, Guid familyId, string name,
        decimal quantity = 2, decimal min = 1, decimal max = 5)
    {
        var resp = await CreateProductAsync(user, familyId, name, quantity, min, max);
        resp.EnsureSuccessStatusCode();
        return Guid.Parse(
            (await resp.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("product").GetProperty("id").GetString()!);
    }
}
