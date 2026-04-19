using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class CompanyContact : AuditableEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    public string? Title { get; set; }
    public string? Department { get; set; }

    public string? Phone1 { get; set; }
    public string? Phone2 { get; set; }
    public string? Email { get; set; }

    public bool IsPrimary { get; set; } = false;

    public string? Description { get; set; }
}