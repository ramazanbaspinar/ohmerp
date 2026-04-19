using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class UnitOfMeasure : AuditableEntity
{

    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public string? Description { get; set; }
}