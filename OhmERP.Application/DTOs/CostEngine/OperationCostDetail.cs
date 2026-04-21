namespace OhmERP.Application.DTOs.CostEngine;

public class OperationCostDetail
{
    public Guid WorkCenterId { get; set; }
    public string WorkCenterCode { get; set; } = string.Empty;
    public string WorkCenterName { get; set; } = string.Empty;
    public int OperationOrder { get; set; }
    public decimal SetupTime { get; set; }
    public decimal RunTime { get; set; }
    public decimal TotalTimeMinutes { get; set; }
    public decimal HourlyMachineCost { get; set; }
    public decimal HourlyLaborCost { get; set; }
    public int Currency { get; set; }
    public decimal TotalCost { get; set; }
}
