using OhmERP.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace OhmERP.Application.DTOs.WorkCenter;

public class WorkCenterListDto
{
    public Guid Id { get; set; }

    [Display(Name = "Makine Kodu")]
    public string Code { get; set; } = string.Empty;

    [Display(Name = "Makine Adı")]
    public string Name { get; set; } = string.Empty;

    [Display(Name = "Tipi", AutoGenerateField = false)]
    public WorkCenterType Type { get; set; }

    [Display(Name = "Saatlik Makine Maliyeti")]
    public decimal HourlyMachineCost { get; set; }

    [Display(Name = "Saatlik İşçilik Maliyeti")]
    public decimal HourlyLaborCost { get; set; }

    [Display(Name = "Para Birimi")]
    public CurrencyType Currency { get; set; }

    [Display(Name = "Durum")]
    public bool IsActive { get; set; }
}
