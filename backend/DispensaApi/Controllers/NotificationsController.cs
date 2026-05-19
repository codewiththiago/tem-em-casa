using System.Security.Claims;
using DispensaApi.Data;
using DispensaApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DispensaApi.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController(ProductAlertService alertService, AppDbContext db) : ControllerBase
{
    [HttpPost("send-alerts/{familyId:guid}")]
    public async Task<IActionResult> SendAlerts(Guid familyId)
    {
        var userId = GetUserId();
        var isMember = await db.FamilyMembers.AnyAsync(m => m.FamilyGroupId == familyId && m.UserId == userId);
        if (!isMember) return Forbid();

        await alertService.SendAlertsForGroupAsync(familyId);
        return Ok(new { message = "Alertas enviados." });
    }

    private Guid GetUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(value, out var id) ? id : throw new InvalidOperationException("Invalid user identity claim.");
    }
}
