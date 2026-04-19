using OhmERP.Domain.Common;
using OhmERP.Domain.Enums;

namespace OhmERP.Domain.Entities;

public class Company : AuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ShortName { get; set; }

    public CompanyType Type { get; set; }

    public string? PrimaryContactPerson { get; set; }
    public string? Phone1 { get; set; }
    public string? Phone2 { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }

    public Guid CityId { get; set; }
    public City City { get; set; } = null!;

    public Guid DistrictId { get; set; }
    public District District { get; set; } = null!;

    public string? Address { get; set; }
    public string? ZipCode { get; set; }

    public string? TaxOffice { get; set; }
    public string? TaxNumber { get; set; }
    public bool IsEInvoiceUser { get; set; } = false;
    public string? EInvoiceAlias { get; set; } 

    public string? DefaultCurrency { get; set; } 
    public int? PaymentTermDays { get; set; }
    public decimal CreditLimit { get; set; } = 0; 
    public string? GLCode { get; set; } 

    public bool IsActive { get; set; } = true;
    public string? Description { get; set; }

    public ICollection<CompanyContact> Contacts { get; set; } = new List<CompanyContact>();
}