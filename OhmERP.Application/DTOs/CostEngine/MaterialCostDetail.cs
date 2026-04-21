namespace OhmERP.Application.DTOs.CostEngine;

public class MaterialCostDetail
{
    public Guid MaterialId { get; set; }
    public string MaterialCode { get; set; } = string.Empty;
    public string MaterialName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal ScrapRate { get; set; }
    public decimal NetQuantity { get; set; }
    public decimal UnitPrice { get; set; }
    public int Currency { get; set; }
    public decimal TotalCost { get; set; }
}
