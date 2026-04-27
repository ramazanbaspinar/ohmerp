using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class ProductOperation : AuditableEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    
    public Guid WorkCenterId { get; set; }
    public WorkCenter WorkCenter { get; set; } = null!;
    
    public int SequenceOrder { get; set; }
    public decimal OperationTimeMinutes { get; set; }
    public bool IsInnerProductRoute { get; set; }
}
