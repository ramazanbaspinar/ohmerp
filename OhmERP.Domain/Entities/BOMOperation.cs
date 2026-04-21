using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class BOMOperation : AuditableEntity
{
    public Guid BOMId { get; set; }
    public Guid WorkCenterId { get; set; }
    public int OperationOrder { get; set; }
    public decimal SetupTime { get; set; }
    public decimal RunTime { get; set; }

    public BOM? BOM { get; set; }
    public WorkCenter? WorkCenter { get; set; }
}
