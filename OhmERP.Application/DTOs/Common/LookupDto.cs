namespace OhmERP.Application.DTOs.Common;

public class LookupDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public Guid? DefaultUnitOfMeasureId { get; set; }
}