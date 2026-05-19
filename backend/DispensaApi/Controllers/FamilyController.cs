using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using DispensaApi.Data;
using DispensaApi.DTOs;
using DispensaApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace DispensaApi.Controllers;

[ApiController]
[Route("api/family")]
[Authorize]
public class FamilyController(AppDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFamilyRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || !System.Text.RegularExpressions.Regex.IsMatch(req.Pin, @"^\d{4}$"))
            return BadRequest("Name required and PIN must be 4 digits.");

        var userId = GetUserId();
        var pinHash = BCrypt.Net.BCrypt.HashPassword(req.Pin);

        // Retry on the (extremely rare) unique constraint collision for invite_code.
        for (int attempt = 0; attempt < 5; attempt++)
        {
            var group = new FamilyGroup
            {
                Name = req.Name.Trim(),
                PinHash = pinHash,
                InviteCode = GenerateCode(),
                CreatedBy = userId,
            };
            db.FamilyGroups.Add(group);
            db.FamilyMembers.Add(new FamilyMember { FamilyGroupId = group.Id, UserId = userId });

            try
            {
                await db.SaveChangesAsync();
                await LogActivity(group.Id, userId, "create_group", null);
                return Ok(new { group = await GetGroupDto(group.Id) });
            }
            catch (DbUpdateException ex) when (IsInviteCodeConflict(ex))
            {
                db.ChangeTracker.Clear();
            }
        }

        return StatusCode(500, new { message = "Não foi possível gerar código de convite único." });
    }

    [HttpPost("join")]
    [EnableRateLimiting("join-family")]
    public async Task<IActionResult> Join([FromBody] JoinFamilyRequest req)
    {
        var code = req.InviteCode.Trim().ToUpperInvariant();
        var group = await db.FamilyGroups.FirstOrDefaultAsync(g => g.InviteCode == code);

        if (group == null) return NotFound(new { message = "Grupo não encontrado." });
        if (!BCrypt.Net.BCrypt.Verify(req.Pin, group.PinHash)) return BadRequest(new { message = "PIN incorreto." });

        var userId = GetUserId();
        var already = await db.FamilyMembers.AnyAsync(m => m.FamilyGroupId == group.Id && m.UserId == userId);
        if (!already)
        {
            db.FamilyMembers.Add(new FamilyMember { FamilyGroupId = group.Id, UserId = userId });
            await db.SaveChangesAsync();
            await LogActivity(group.Id, userId, "join_group", null);
        }

        return Ok(new { group = await GetGroupDto(group.Id) });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        if (!await IsMember(id)) return Forbid();
        return Ok(new { group = await GetGroupDto(id) });
    }

    [HttpPut("{id:guid}/settings")]
    public async Task<IActionResult> UpdateSettings(Guid id, [FromBody] UpdateFamilySettingsRequest req)
    {
        if (!await IsMember(id)) return Forbid();

        var group = await db.FamilyGroups.FindAsync(id);
        if (group == null) return NotFound();

        group.WhatsappPhone = req.WhatsappPhone;
        group.NotifyExpiring = req.NotifyExpiring;
        group.NotifyLowStock = req.NotifyLowStock;
        group.UpdatedAt = DateTime.UtcNow;
        group.UpdatedByName = await GetUserName();
        await db.SaveChangesAsync();

        return Ok(new { group = await GetGroupDto(id) });
    }

    [HttpGet("{id:guid}/activity")]
    public async Task<IActionResult> Activity(Guid id)
    {
        if (!await IsMember(id)) return Forbid();

        var logs = await db.ActivityLogs
            .Where(a => a.FamilyGroupId == id)
            .OrderByDescending(a => a.CreatedAt)
            .Take(50)
            .Select(a => new ActivityLogDto(a.Id, a.UserName, a.Action, a.ProductName, a.CreatedAt))
            .ToListAsync();

        return Ok(new { logs });
    }

    [HttpDelete("{id:guid}/leave")]
    public async Task<IActionResult> Leave(Guid id)
    {
        var userId = GetUserId();
        var member = await db.FamilyMembers.FirstOrDefaultAsync(m => m.FamilyGroupId == id && m.UserId == userId);
        if (member == null) return NotFound();

        db.FamilyMembers.Remove(member);
        await db.SaveChangesAsync();

        // Auto-delete group when last member leaves — prevents orphaned groups
        var remaining = await db.FamilyMembers.CountAsync(m => m.FamilyGroupId == id);
        if (remaining == 0)
        {
            var group = await db.FamilyGroups.FindAsync(id);
            if (group != null) db.FamilyGroups.Remove(group);
            await db.SaveChangesAsync();
        }

        return Ok();
    }

    private async Task<FamilyGroupDto> GetGroupDto(Guid id)
    {
        var g = await db.FamilyGroups
            .Include(x => x.Members).ThenInclude(m => m.User)
            .FirstAsync(x => x.Id == id);

        return new FamilyGroupDto(
            g.Id, g.Name, g.InviteCode,
            g.WhatsappPhone, g.NotifyExpiring, g.NotifyLowStock,
            g.UpdatedAt, g.UpdatedByName,
            g.Members.Select(m => new MemberDto(m.User.Id, m.User.Name, m.JoinedAt)).ToList());
    }

    private async Task<bool> IsMember(Guid groupId)
    {
        var userId = GetUserId();
        return await db.FamilyMembers.AnyAsync(m => m.FamilyGroupId == groupId && m.UserId == userId);
    }

    private async Task LogActivity(Guid groupId, Guid userId, string action, string? productName)
    {
        var name = await db.Users.Where(u => u.Id == userId).Select(u => u.Name).FirstOrDefaultAsync() ?? "Alguém";
        db.ActivityLogs.Add(new ActivityLog
        {
            FamilyGroupId = groupId,
            UserId = userId,
            UserName = name,
            Action = action,
            ProductName = productName,
        });
        await db.SaveChangesAsync();
    }

    private async Task<string> GetUserName()
    {
        var userId = GetUserId();
        return await db.Users.Where(u => u.Id == userId).Select(u => u.Name).FirstOrDefaultAsync() ?? "Alguém";
    }

    private static string GenerateCode()
    {
        const string letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const string digits = "23456789";
        var sb = new StringBuilder(6);
        for (int i = 0; i < 4; i++) sb.Append(letters[Random.Shared.Next(letters.Length)]);
        for (int i = 0; i < 2; i++) sb.Append(digits[Random.Shared.Next(digits.Length)]);
        return sb.ToString();
    }

    private static bool IsInviteCodeConflict(DbUpdateException ex) =>
        ex.InnerException?.Message.Contains("invite_code", StringComparison.OrdinalIgnoreCase) == true ||
        ex.InnerException?.Message.Contains("InviteCode", StringComparison.OrdinalIgnoreCase) == true;

    private Guid GetUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(value, out var id) ? id : throw new InvalidOperationException("Invalid user identity claim.");
    }
}
