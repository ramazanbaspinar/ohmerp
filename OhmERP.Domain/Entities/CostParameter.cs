using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class CostParameter : AuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal PercentageValue { get; set; }
    public string? Description { get; set; }
    public bool IsSystemDefined { get; set; } = false;
}
