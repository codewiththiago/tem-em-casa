using System.ComponentModel.DataAnnotations;

namespace DispensaApi.DTOs;

public class SaveProductRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = "";

    [Required, MaxLength(50)]
    public string Category { get; set; } = "";

    [Required, MaxLength(50)]
    public string Location { get; set; } = "";

    [Range(0, 99999)]
    public decimal Quantity { get; set; }

    [Range(0, 99999)]
    public decimal MinQuantity { get; set; } = 1;

    [Range(0, 99999)]
    public decimal MaxQuantity { get; set; } = 5;

    [Required, MaxLength(20)]
    public string Unit { get; set; } = "un";

    public string? ExpiryDate { get; set; }

    [MaxLength(50)]
    public string? Barcode { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public record ProductDto(
    Guid Id, string Name, string Category, string Location,
    decimal Quantity, decimal MinQuantity, decimal MaxQuantity, string Unit,
    string? ExpiryDate, string? Barcode, string? Notes,
    DateTime UpdatedAt, string? UpdatedByName);

public record ShoppingItem(
    Guid Id, string Name, string Category, string Location,
    decimal Quantity, decimal MinQuantity, decimal MaxQuantity, string Unit,
    decimal ToBuy, bool Urgent);
