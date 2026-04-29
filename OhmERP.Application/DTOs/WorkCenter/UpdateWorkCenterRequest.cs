using OhmERP.Domain.Enums;

namespace OhmERP.Application.DTOs.WorkCenter;

public class UpdateWorkCenterRequest
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public MachineCalculationType CalculationType { get; set; }
    public decimal SetupTime { get; set; }
    public decimal UnitProcessTime { get; set; }
    public int? BatchCapacityLimit { get; set; }
    public bool IsActive { get; set; } = true;
}
