using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class ItemAttributeValue : AuditableEntity
{
    public Guid ItemId { get; set; }
    public Item Item { get; set; } = null!;

    public Guid CategoryAttributeId { get; set; }
    public CategoryAttribute CategoryAttribute { get; set; } = null!;

    public string? StringValue { get; set; }
    public decimal? DecimalValue { get; set; }
}
