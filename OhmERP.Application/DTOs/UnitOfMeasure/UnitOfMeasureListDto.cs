using System.ComponentModel.DataAnnotations;

namespace OhmERP.Application.DTOs.UnitOfMeasure;

public class UnitOfMeasureListDto
{
    public Guid Id { get; set; }

    [Display(Name = "Birim Kodu")]
    public string Code { get; set; } = string.Empty;

    [Display(Name = "Birim Adı")]
    public string Name { get; set; } = string.Empty;

    [Display(Name = "Durum")]
    public bool IsActive { get; set; }

    [Display(Name = "Açıklama")]
    public string? Description { get; set; }
}