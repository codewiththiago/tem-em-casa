namespace DispensaApi.DTOs;

public class SaveProductRequest
{
    public string Name { get; set; } = "";
    public string Category { get; set; } = "";
    public string Location { get; set; } = "";
    public decimal Quantity { get; set; }
    public decimal MinQuantity { get; set; } = 1;
    public decimal MaxQuantity { get; set; } = 5;
    public string Unit { get; set; } = "un";
    public string? ExpiryDate { get; set; }
    public string? Barcode { get; set; }
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
