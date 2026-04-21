namespace OhmERP.Application.DTOs.BOM;

public class BOMOperationDto
{
    public Guid? Id { get; set; }
    public Guid WorkCenterId { get; set; }
    public int OperationOrder { get; set; }
    public decimal SetupTime { get; set; }
    public decimal RunTime { get; set; }
}
