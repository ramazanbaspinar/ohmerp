namespace OhmERP.Application.DTOs.CategoryAttribute;

public class CategoryAttributeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public int? Precision { get; set; }
    public bool IsRequired { get; set; }
    public int SortOrder { get; set; }
}
