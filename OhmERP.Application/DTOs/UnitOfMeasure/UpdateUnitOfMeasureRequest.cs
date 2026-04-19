namespace OhmERP.Application.DTOs.UnitOfMeasure;

public class UpdateUnitOfMeasureRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string? Description { get; set; }
}