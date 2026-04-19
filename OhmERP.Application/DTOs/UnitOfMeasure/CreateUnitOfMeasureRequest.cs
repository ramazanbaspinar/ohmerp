namespace OhmERP.Application.DTOs.UnitOfMeasure;

public class CreateUnitOfMeasureRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}