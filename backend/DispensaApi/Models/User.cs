using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DispensaApi.Models;

[Table("users")]
public class User
{
    [Column("id")] public Guid Id { get; set; } = Guid.NewGuid();
    [Column("firebase_uid")] public string FirebaseUid { get; set; } = "";
    [Column("name")] public string Name { get; set; } = "";
    [Column("email")] public string? Email { get; set; }
    [Column("fcm_token")] public string? FcmToken { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [Column("last_seen_at")] public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;

    public ICollection<FamilyMember> FamilyMemberships { get; set; } = [];
}
