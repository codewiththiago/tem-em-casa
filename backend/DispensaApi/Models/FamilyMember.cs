using System.ComponentModel.DataAnnotations.Schema;

namespace DispensaApi.Models;

[Table("family_members")]
public class FamilyMember
{
    [Column("id")] public Guid Id { get; set; } = Guid.NewGuid();
    [Column("family_group_id")] public Guid FamilyGroupId { get; set; }
    [Column("user_id")] public Guid UserId { get; set; }
    [Column("joined_at")] public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public FamilyGroup FamilyGroup { get; set; } = null!;
    public User User { get; set; } = null!;
}
