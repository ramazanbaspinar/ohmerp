using OhmERP.Domain.Common;
using OhmERP.Domain.Enums;

namespace OhmERP.Domain.Entities;

public class Item : AuditableEntity
{

    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public Guid CategoryId { get; set; }
    public ItemCategory Category { get; set; } = null!;

    public Guid UnitOfMeasureId { get; set; }
    public UnitOfMeasure UnitOfMeasure { get; set; } = null!;

    public ItemType Type { get; set; }

    public decimal TaxRate { get; set; } = 20m; // Varsayılan KDV
    public string? Barcode { get; set; }

    public decimal CriticalStockLevel { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public decimal UnitCost { get; set; } = 0m;
    public CurrencyType CostCurrency { get; set; } = CurrencyType.TL;

    public string? PropertiesJson { get; set; }

    public string? Description { get; set; }

    public ICollection<ItemAttributeValue> AttributeValues { get; set; } = new List<ItemAttributeValue>();
}
