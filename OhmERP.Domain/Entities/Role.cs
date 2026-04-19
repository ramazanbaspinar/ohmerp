using OhmERP.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace OhmERP.Domain.Entities;

public class Role : AuditableEntity
{
    [MaxLength(20)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}