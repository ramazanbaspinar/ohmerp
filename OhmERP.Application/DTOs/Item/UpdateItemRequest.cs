using OhmERP.Domain.Enums;

namespace OhmERP.Application.DTOs.Item;

public class UpdateItemRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public Guid UnitOfMeasureId { get; set; }
    public ItemType Type { get; set; }
    public decimal TaxRate { get; set; }
    public string? Barcode { get; set; }
    public decimal CriticalStockLevel { get; set; }
    public bool IsActive { get; set; }
    public string? PropertiesJson { get; set; }
    public string? Description { get; set; }
}