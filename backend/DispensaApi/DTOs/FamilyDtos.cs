namespace DispensaApi.DTOs;

public class CreateFamilyRequest
{
    public string Name { get; set; } = "";
    public string Pin { get; set; } = "";
}

public class JoinFamilyRequest
{
    public string InviteCode { get; set; } = "";
    public string Pin { get; set; } = "";
}

public class UpdateFamilySettingsRequest
{
    public string? WhatsappPhone { get; set; }
    public bool NotifyExpiring { get; set; } = true;
    public bool NotifyLowStock { get; set; } = true;
}

public record MemberDto(Guid Id, string Name, DateTime JoinedAt);

public record FamilyGroupDto(
    Guid Id, string Name, string InviteCode,
    string? WhatsappPhone, bool NotifyExpiring, bool NotifyLowStock,
    DateTime UpdatedAt, string? UpdatedByName,
    List<MemberDto> Members);

public record ActivityLogDto(Guid Id, string UserName, string Action, string? ProductName, DateTime CreatedAt);
