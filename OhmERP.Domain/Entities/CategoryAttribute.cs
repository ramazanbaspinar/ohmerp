using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class CategoryAttribute : AuditableEntity
{
    public Guid ItemCategoryId { get; set; }
    public ItemCategory ItemCategory { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public int? Precision { get; set; }
    public bool IsRequired { get; set; }
    public int SortOrder { get; set; }

    public ICollection<ItemAttributeValue> AttributeValues { get; set; } = new List<ItemAttributeValue>();
}
