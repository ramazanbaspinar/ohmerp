using OhmERP.Domain.Enums;

namespace OhmERP.Application.DTOs.Company;

public class CompanyListDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public CompanyType Type { get; set; }
    public string TypeName => Type.ToString();
    public string? PrimaryContactPerson { get; set; }
    public string? Phone1 { get; set; }
    public string CityName { get; set; } = string.Empty;
    public string DistrictName { get; set; } = string.Empty;
    public string? TaxOffice { get; set; }
    public string? TaxNumber { get; set; }
    public decimal CreditLimit { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
}