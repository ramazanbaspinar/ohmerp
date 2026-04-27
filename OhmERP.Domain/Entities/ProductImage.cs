using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class ProductImage : AuditableEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    
    public string ImageBase64 { get; set; } = string.Empty;
    public int SequenceOrder { get; set; }
}
