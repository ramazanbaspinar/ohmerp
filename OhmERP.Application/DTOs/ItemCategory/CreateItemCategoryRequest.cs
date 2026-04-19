namespace OhmERP.Application.DTOs.ItemCategory;

public class CreateItemCategoryRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
    public string? Description { get; set; }
}