using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class User : AuditableEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public byte[] PasswordHash { get; set; } = Array.Empty<byte>();
    public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}