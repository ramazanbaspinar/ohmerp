using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class BOM : AuditableEntity
{
    public Guid ItemId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; } = false;

    public Item? Item { get; set; }
    public ICollection<BOMLine> BOMLines { get; set; } = new List<BOMLine>();
    public ICollection<BOMOperation> BOMOperations { get; set; } = new List<BOMOperation>();
}
