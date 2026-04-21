using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class BOMLine : AuditableEntity
{
    public Guid BOMId { get; set; }
    public Guid MaterialId { get; set; }
    public Guid UnitOfMeasureId { get; set; }
    public decimal Quantity { get; set; }
    public decimal ScrapRate { get; set; }

    public BOM? BOM { get; set; }
    public Item? Material { get; set; }
    public UnitOfMeasure? UnitOfMeasure { get; set; }
}
