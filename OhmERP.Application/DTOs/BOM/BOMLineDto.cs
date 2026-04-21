namespace OhmERP.Application.DTOs.BOM;

public class BOMLineDto
{
    public Guid? Id { get; set; }
    public Guid MaterialId { get; set; }
    public Guid UnitOfMeasureId { get; set; }
    public decimal Quantity { get; set; }
    public decimal ScrapRate { get; set; }
}
