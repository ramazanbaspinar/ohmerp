using OhmERP.Domain.Common;
using OhmERP.Domain.Enums;

namespace OhmERP.Domain.Entities;

public class OverheadCost : AuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal MonthlyAmount { get; set; }
    public CurrencyType Currency { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}
