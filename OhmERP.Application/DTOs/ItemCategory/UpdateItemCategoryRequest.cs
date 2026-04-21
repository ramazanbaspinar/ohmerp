namespace OhmERP.Application.DTOs.ItemCategory;

public class UpdateItemCategoryRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
    public bool IsActive { get; set; }
    public bool ShowInMenu { get; set; }
    public string? Description { get; set; }
    public Guid? DefaultUnitOfMeasureId { get; set; }
}