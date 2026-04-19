using OhmERP.Domain.Enums;

namespace OhmERP.Application.DTOs.Item;

public class CreateItemRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public Guid UnitOfMeasureId { get; set; }
    public ItemType Type { get; set; }
    public decimal TaxRate { get; set; } = 20m;
    public string? Barcode { get; set; }
    public decimal CriticalStockLevel { get; set; } = 0;
    public string? PropertiesJson { get; set; } // Örn: "{\"Ohm\": 12.5, \"Cap\": 0.35}"
    public string? Description { get; set; }
}