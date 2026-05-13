using System.ComponentModel.DataAnnotations.Schema;

namespace DispensaApi.Models;

[Table("products")]
public class Product
{
    [Column("id")] public Guid Id { get; set; } = Guid.NewGuid();
    [Column("family_group_id")] public Guid FamilyGroupId { get; set; }
    [Column("name")] public string Name { get; set; } = "";
    [Column("category")] public string Category { get; set; } = "";
    [Column("location")] public string Location { get; set; } = "";
    [Column("quantity")] public decimal Quantity { get; set; }
    [Column("min_quantity")] public decimal MinQuantity { get; set; } = 1;
    [Column("max_quantity")] public decimal MaxQuantity { get; set; } = 5;
    [Column("unit")] public string Unit { get; set; } = "un";
    [Column("expiry_date")] public DateOnly? ExpiryDate { get; set; }
    [Column("barcode")] public string? Barcode { get; set; }
    [Column("notes")] public string? Notes { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    [Column("updated_by_name")] public string? UpdatedByName { get; set; }

    public FamilyGroup FamilyGroup { get; set; } = null!;
}
