using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class ItemCategory : AuditableEntity
{

    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public Guid? ParentId { get; set; }
    public ItemCategory? Parent { get; set; }

    public bool IsActive { get; set; } = true;

    public bool ShowInMenu { get; set; } = false;

    public string? Description { get; set; }

    public Guid? DefaultUnitOfMeasureId { get; set; }
    public UnitOfMeasure? DefaultUnitOfMeasure { get; set; }

    public ICollection<Item> Items { get; set; } = new List<Item>();

    public ICollection<ItemCategory> SubCategories { get; set; } = new List<ItemCategory>();

    public ICollection<CategoryAttribute> CategoryAttributes { get; set; } = new List<CategoryAttribute>();
}