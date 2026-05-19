using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace DispensaApi.Controllers;

[ApiController]
[Route("api/barcode")]
[Authorize]
public class BarcodeController(IHttpClientFactory http) : ControllerBase
{
    [HttpGet("{code}")]
    public async Task<IActionResult> Lookup(string code)
    {
        var client = http.CreateClient();
        client.DefaultRequestHeaders.UserAgent.ParseAdd("TemEmCasa/1.0");

        var url = $"https://world.openfoodfacts.org/api/v2/product/{code}.json?fields=product_name,product_name_pt,categories_tags";
        var response = await client.GetAsync(url);
        if (!response.IsSuccessStatusCode) return NotFound();

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        if (!doc.RootElement.TryGetProperty("status", out var status) || status.GetInt32() != 1)
            return NotFound(new { message = "Produto não encontrado." });

        var product = doc.RootElement.GetProperty("product");
        var name = product.TryGetProperty("product_name_pt", out var namePt) && !string.IsNullOrWhiteSpace(namePt.GetString())
            ? namePt.GetString()
            : product.TryGetProperty("product_name", out var nameEn) ? nameEn.GetString() : null;

        var category = "Outros";
        if (product.TryGetProperty("categories_tags", out var cats) && cats.ValueKind == JsonValueKind.Array)
        {
            var catMap = new Dictionary<string, string>
            {
                ["en:beverages"] = "Bebidas",
                ["en:foods"] = "Alimentos",
                ["en:cereals"] = "Alimentos",
                ["en:dairy"] = "Alimentos",
                ["en:meats"] = "Alimentos",
                ["en:cleaning"] = "Limpeza",
                ["en:personal-care"] = "Higiene",
            };
            foreach (var tag in cats.EnumerateArray())
            {
                var t = tag.GetString() ?? "";
                if (catMap.TryGetValue(t, out var mapped)) { category = mapped; break; }
            }
        }

        return Ok(new { name, category, barcode = code });
    }
}
