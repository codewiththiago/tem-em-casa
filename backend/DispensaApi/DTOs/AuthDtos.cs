namespace DispensaApi.DTOs;

public class LoginRequest
{
    public string IdToken { get; set; } = "";
}

public class FcmTokenRequest
{
    public string FcmToken { get; set; } = "";
}

public record UserDto(Guid Id, string Name, string? Email);

public record LoginResponse(string Token, UserDto User, Guid? FamilyGroupId);
