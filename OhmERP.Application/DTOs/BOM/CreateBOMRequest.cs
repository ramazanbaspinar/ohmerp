namespace OhmERP.Application.DTOs.BOM;

public class CreateBOMRequest
{
    public Guid ItemId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }
    
    public List<BOMLineDto> BOMLines { get; set; } = new();
    public List<BOMOperationDto> BOMOperations { get; set; } = new();
}
