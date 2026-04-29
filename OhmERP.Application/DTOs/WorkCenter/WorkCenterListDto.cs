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

    [Display(Name = "Kategori")]
    public string Category { get; set; } = string.Empty;

    [Display(Name = "Hesaplama Tipi", AutoGenerateField = false)]
    public MachineCalculationType CalculationType { get; set; }


    [Display(Name = "Hazırlık Süresi")]
    public decimal SetupTime { get; set; }

    [Display(Name = "Birim İşlem Süresi")]
    public decimal UnitProcessTime { get; set; }

    [Display(Name = "Parti Kapasite Sınırı")]
    public int? BatchCapacityLimit { get; set; }



    [Display(Name = "Durum")]
    public bool IsActive { get; set; }
}
