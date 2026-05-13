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
    public IActionResult Health([FromServices] IConfiguration cfg)
    {
        var key = cfg["Firebase:ServiceAccountKey"] ?? "";

        string? pkFirstLine = null;
        string? pkParseError = null;
        try
        {
            string jsonKey;
            try
            {
                var cleanB64 = key.Replace("\n", "").Replace("\r", "").Replace(" ", "");
                jsonKey = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(cleanB64));
            }
            catch
            {
                jsonKey = FirebaseService.FixLiteralNewlinesInJsonStrings(key);
            }
            using var doc = System.Text.Json.JsonDocument.Parse(jsonKey);
            var pk = doc.RootElement.GetProperty("private_key").GetString() ?? "";
            if (!pk.Contains('\n')) pk = pk.Replace("\\n", "\n");
            pkFirstLine = pk.Split('\n')[0];
        }
        catch (Exception ex) { pkParseError = ex.Message; }

        return Ok(new
        {
            firebase_project_cfg    = !string.IsNullOrEmpty(cfg["Firebase:ProjectId"]),
            firebase_key_cfg        = !string.IsNullOrEmpty(key),
            firebase_key_length     = key.Length,
            firebase_key_has_lf     = key.Contains('\n'),
            firebase_key_looks_b64  = !key.TrimStart().StartsWith("{"),
            firebase_pk_first_line  = pkFirstLine,
            firebase_pk_parse_error = pkParseError,
            firebase_init_error     = firebase.InitError,
        });
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
