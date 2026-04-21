namespace OhmERP.Application.DTOs.ItemAttributeValue;

public class ItemAttributeValueDto
{
    public Guid Id { get; set; }
    public Guid CategoryAttributeId { get; set; }
    public string? StringValue { get; set; }
    public decimal? DecimalValue { get; set; }
}
