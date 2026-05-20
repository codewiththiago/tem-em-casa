using System.Security.Claims;
using DispensaApi.Data;
using DispensaApi.DTOs;
using DispensaApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DispensaApi.Controllers;

[ApiController]
[Route("api/family/{familyId:guid}/products")]
[Authorize]
public class ProductsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid familyId)
    {
        if (!await IsMember(familyId)) return Forbid();
        var products = await db.Products
            .Where(p => p.FamilyGroupId == familyId)
            .OrderBy(p => p.Name)
            .Select(p => ToDto(p))
            .ToListAsync();
        return Ok(new { products });
    }

    [HttpGet("alerts")]
    public async Task<IActionResult> Alerts(Guid familyId)
    {
        if (!await IsMember(familyId)) return Forbid();
        var today = DispensaApi.Services.LocalTime.Today();
        var products = await db.Products
            .Where(p => p.FamilyGroupId == familyId &&
                        (p.Quantity < p.MinQuantity ||
                         (p.ExpiryDate.HasValue && p.ExpiryDate.Value <= today.AddDays(7))))
            .OrderBy(p => p.Quantity)
            .Select(p => ToDto(p))
            .ToListAsync();
        return Ok(new { products });
    }

    [HttpGet("shopping")]
    public async Task<IActionResult> Shopping(Guid familyId)
    {
        if (!await IsMember(familyId)) return Forbid();
        var products = await db.Products
            .Where(p => p.FamilyGroupId == familyId && p.Quantity < p.MinQuantity)
            .ToListAsync();

        var items = products.Select(p => new ShoppingItem(
            p.Id, p.Name, p.Category, p.Location,
            p.Quantity, p.MinQuantity, p.MaxQuantity, p.Unit,
            Math.Max(1, p.MaxQuantity - p.Quantity),
            p.Quantity == 0))
            .OrderByDescending(i => i.Urgent)
            .ToList();

        return Ok(new { items });
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid familyId, [FromBody] SaveProductRequest req)
    {
        if (!await IsMember(familyId)) return Forbid();
        if (req.MinQuantity > req.MaxQuantity)
            return BadRequest(new { message = "Quantidade mínima não pode ser maior que a máxima." });

        var product = new Product
        {
            FamilyGroupId = familyId,
            Name = req.Name.Trim(),
            Category = req.Category,
            Location = req.Location,
            Quantity = req.Quantity,
            MinQuantity = req.MinQuantity,
            MaxQuantity = req.MaxQuantity,
            Unit = req.Unit,
            ExpiryDate = ParseDate(req.ExpiryDate),
            Barcode = req.Barcode,
            Notes = req.Notes,
            UpdatedByName = await GetUserName(),
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();
        await LogActivity(familyId, "add_product", product.Name);

        return Ok(new { product = ToDto(product) });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid familyId, Guid id, [FromBody] SaveProductRequest req)
    {
        if (!await IsMember(familyId)) return Forbid();
        if (req.MinQuantity > req.MaxQuantity)
            return BadRequest(new { message = "Quantidade mínima não pode ser maior que a máxima." });

        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id && p.FamilyGroupId == familyId);
        if (product == null) return NotFound();

        if (req.UpdatedAt.HasValue &&
            Math.Abs((product.UpdatedAt - req.UpdatedAt.Value).TotalSeconds) > 2)
            return Conflict(new { message = "Este produto foi alterado por outro membro. Recarregue e tente novamente." });

        product.Name = req.Name.Trim();
        product.Category = req.Category;
        product.Location = req.Location;
        product.Quantity = req.Quantity;
        product.MinQuantity = req.MinQuantity;
        product.MaxQuantity = req.MaxQuantity;
        product.Unit = req.Unit;
        product.ExpiryDate = ParseDate(req.ExpiryDate);
        product.Barcode = req.Barcode;
        product.Notes = req.Notes;
        product.UpdatedAt = DateTime.UtcNow;
        product.UpdatedByName = await GetUserName();

        await db.SaveChangesAsync();
        await LogActivity(familyId, "edit_product", product.Name);

        return Ok(new { product = ToDto(product) });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid familyId, Guid id)
    {
        if (!await IsMember(familyId)) return Forbid();

        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id && p.FamilyGroupId == familyId);
        if (product == null) return NotFound();

        var name = product.Name;
        db.Products.Remove(product);
        await db.SaveChangesAsync();
        await LogActivity(familyId, "delete_product", name);

        return Ok();
    }

    private static ProductDto ToDto(Product p) => new(
        p.Id, p.Name, p.Category, p.Location,
        p.Quantity, p.MinQuantity, p.MaxQuantity, p.Unit,
        p.ExpiryDate?.ToString("yyyy-MM-dd"),
        p.Barcode, p.Notes, p.UpdatedAt, p.UpdatedByName);

    private static DateOnly? ParseDate(string? s) =>
        string.IsNullOrWhiteSpace(s) ? null : DateOnly.TryParse(s, out var d) ? d : null;

    private async Task<bool> IsMember(Guid groupId)
    {
        var userId = GetUserId();
        return await db.FamilyMembers.AnyAsync(m => m.FamilyGroupId == groupId && m.UserId == userId);
    }

    private async Task LogActivity(Guid groupId, string action, string? productName)
    {
        var userId = GetUserId();
        var name = await GetUserName();
        db.ActivityLogs.Add(new ActivityLog
        {
            FamilyGroupId = groupId, UserId = userId,
            UserName = name, Action = action, ProductName = productName,
        });
        await db.SaveChangesAsync();
    }

    private async Task<string> GetUserName()
    {
        var userId = GetUserId();
        return await db.Users.Where(u => u.Id == userId).Select(u => u.Name).FirstOrDefaultAsync() ?? "Alguém";
    }

    private Guid GetUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(value, out var id) ? id : throw new InvalidOperationException("Invalid user identity claim.");
    }
}
