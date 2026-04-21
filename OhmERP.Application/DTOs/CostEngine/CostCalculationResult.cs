namespace OhmERP.Application.DTOs.CostEngine;

public class CostCalculationResult
{
    public decimal TotalMaterialCost { get; set; }
    public decimal TotalOperationCost { get; set; }
    public decimal GrandTotalCost { get; set; }
    public List<MaterialCostDetail> MaterialDetails { get; set; } = new();
    public List<OperationCostDetail> OperationDetails { get; set; } = new();
}
