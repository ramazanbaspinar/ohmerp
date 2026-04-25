using OhmERP.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace OhmERP.Application.DTOs.OverheadCost;

public class OverheadCostListDto
{
    public Guid Id { get; set; }

    [Display(Name = "Gider Kodu")]
    public string Code { get; set; } = string.Empty;

    [Display(Name = "Gider Adı")]
    public string Name { get; set; } = string.Empty;

    [Display(Name = "Aylık Tutar")]
    public decimal MonthlyAmount { get; set; }

    [Display(Name = "Para Birimi")]
    public CurrencyType Currency { get; set; }

    [Display(Name = "Açıklama")]
    public string? Description { get; set; }

    [Display(Name = "Durum")]
    public bool IsActive { get; set; }
}

public class CreateOverheadCostRequest
{
    [Required(ErrorMessage = "Gider Kodu zorunludur.")]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Gider Adı zorunludur.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Aylık Tutar zorunludur.")]
    public decimal MonthlyAmount { get; set; }

    [Required(ErrorMessage = "Para Birimi zorunludur.")]
    public CurrencyType Currency { get; set; }

    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateOverheadCostRequest : CreateOverheadCostRequest
{
    public Guid Id { get; set; }
}
