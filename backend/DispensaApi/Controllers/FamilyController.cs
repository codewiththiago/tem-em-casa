using System.Security.Claims;
using System.Text;
using DispensaApi.Data;
using DispensaApi.DTOs;
using DispensaApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        if (string.IsNullOrWhiteSpace(req.Name) || req.Pin.Length != 4)
            return BadRequest("Name required and PIN must be 4 digits.");

        var userId = GetUserId();
        var code = await GenerateUniqueCode();

        var group = new FamilyGroup
        {
            Name = req.Name.Trim(),
            Pin = req.Pin,
            InviteCode = code,
            CreatedBy = userId,
        };
        db.FamilyGroups.Add(group);

        var member = new FamilyMember { FamilyGroupId = group.Id, UserId = userId };
        db.FamilyMembers.Add(member);

        await db.SaveChangesAsync();

        await LogActivity(group.Id, userId, "create_group", null);
        return Ok(new { group = await GetGroupDto(group.Id) });
    }

    [HttpPost("join")]
    public async Task<IActionResult> Join([FromBody] JoinFamilyRequest req)
    {
        var code = req.InviteCode.Trim().ToUpperInvariant();
        var group = await db.FamilyGroups.FirstOrDefaultAsync(g => g.InviteCode == code);

        if (group == null) return NotFound(new { message = "Grupo não encontrado." });
        if (group.Pin != req.Pin) return BadRequest(new { message = "PIN incorreto." });

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
        return Ok();
    }

    private async Task<FamilyGroupDto> GetGroupDto(Guid id)
    {
        var g = await db.FamilyGroups
            .Include(x => x.Members).ThenInclude(m => m.User)
            .FirstAsync(x => x.Id == id);

        return new FamilyGroupDto(
            g.Id, g.Name, g.InviteCode, g.Pin,
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

    private async Task<string> GenerateUniqueCode()
    {
        const string letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const string digits = "23456789";
        var rng = Random.Shared;

        while (true)
        {
            var sb = new StringBuilder(6);
            for (int i = 0; i < 4; i++) sb.Append(letters[rng.Next(letters.Length)]);
            for (int i = 0; i < 2; i++) sb.Append(digits[rng.Next(digits.Length)]);
            var code = sb.ToString();
            if (!await db.FamilyGroups.AnyAsync(g => g.InviteCode == code))
                return code;
        }
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);
}
