using OhmERP.Domain.Enums;

namespace OhmERP.Application.DTOs.WorkCenter;

public class WorkCenterListDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public WorkCenterType Type { get; set; }
    public decimal HourlyMachineCost { get; set; }
    public decimal HourlyLaborCost { get; set; }
    public CurrencyType Currency { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
}
