using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace DispensaApi.Models;

[Table("activity_logs")]
public class ActivityLog
{
    [Column("id")] public Guid Id { get; set; } = Guid.NewGuid();
    [Column("family_group_id")] public Guid FamilyGroupId { get; set; }
    [Column("user_id")] public Guid? UserId { get; set; }
    [Column("user_name")] public string UserName { get; set; } = "";
    [Column("action")] public string Action { get; set; } = "";
    [Column("product_name")] public string? ProductName { get; set; }
    [Column("details", TypeName = "jsonb")] public JsonDocument? Details { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public FamilyGroup FamilyGroup { get; set; } = null!;
}
