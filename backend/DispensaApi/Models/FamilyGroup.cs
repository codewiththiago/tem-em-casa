using System.ComponentModel.DataAnnotations.Schema;

namespace DispensaApi.Models;

[Table("family_groups")]
public class FamilyGroup
{
    [Column("id")] public Guid Id { get; set; } = Guid.NewGuid();
    [Column("name")] public string Name { get; set; } = "";
    [Column("invite_code")] public string InviteCode { get; set; } = "";
    [Column("pin")] public string PinHash { get; set; } = "";
    [Column("created_by")] public Guid? CreatedBy { get; set; }
    [Column("whatsapp_phone")] public string? WhatsappPhone { get; set; }
    [Column("notify_expiring")] public bool NotifyExpiring { get; set; } = true;
    [Column("notify_low_stock")] public bool NotifyLowStock { get; set; } = true;
    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    [Column("updated_by_name")] public string? UpdatedByName { get; set; }

    public ICollection<FamilyMember> Members { get; set; } = [];
    public ICollection<Product> Products { get; set; } = [];
    public ICollection<ActivityLog> ActivityLogs { get; set; } = [];
}
