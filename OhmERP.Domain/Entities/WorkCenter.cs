using OhmERP.Domain.Common;
using OhmERP.Domain.Enums;

namespace OhmERP.Domain.Entities;

public class WorkCenter : AuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public WorkCenterType Type { get; set; }
    public decimal HourlyMachineCost { get; set; }
    public decimal HourlyLaborCost { get; set; }
    public CurrencyType Currency { get; set; }
    public bool IsActive { get; set; } = true;
}
