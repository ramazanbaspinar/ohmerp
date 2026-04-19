using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class RolePermission : AuditableEntity
{
    public Guid RoleId { get; set; }

    public string PermissionCode { get; set; } = string.Empty;

    public virtual Role Role { get; set; } = null!;
}