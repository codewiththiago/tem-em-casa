using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DispensaApi.Data;
using DispensaApi.DTOs;
using DispensaApi.Models;
using DispensaApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace DispensaApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, FirebaseService firebase, IConfiguration cfg) : ControllerBase
{
    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new { status = "ok", firebase = firebase.InitError == null });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        try
        {
            var decoded = await firebase.VerifyTokenAsync(req.IdToken);

            var user = await db.Users.FirstOrDefaultAsync(u => u.FirebaseUid == decoded.Uid);
            if (user == null)
            {
                user = new User
                {
                    FirebaseUid = decoded.Uid,
                    Name = decoded.Claims.TryGetValue("name", out var n) ? n.ToString()! : "Usuário",
                    Email = decoded.Claims.TryGetValue("email", out var e) ? e.ToString() : null,
                };
                db.Users.Add(user);
            }
            user.LastSeenAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            var membership = await db.FamilyMembers
                .Where(m => m.UserId == user.Id)
                .OrderByDescending(m => m.JoinedAt)
                .FirstOrDefaultAsync();

            var token = GenerateJwt(user);
            return Ok(new LoginResponse(token, new UserDto(user.Id, user.Name, user.Email), membership?.FamilyGroupId));
        }
        catch (Exception ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [Authorize]
    [HttpPost("fcm-token")]
    public async Task<IActionResult> UpdateFcmToken([FromBody] FcmTokenRequest req)
    {
        var userId = GetUserId();
        var user = await db.Users.FindAsync(userId);
        if (user == null) return NotFound();
        user.FcmToken = req.FcmToken;
        user.LastSeenAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok();
    }

    private string GenerateJwt(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddHours(double.Parse(cfg["Jwt:ExpiryHours"] ?? "720"));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new Claim("name", user.Name),
        };

        var token = new JwtSecurityToken(
            issuer: cfg["Jwt:Issuer"],
            audience: cfg["Jwt:Audience"],
            claims: claims,
            expires: expiry,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);
}
