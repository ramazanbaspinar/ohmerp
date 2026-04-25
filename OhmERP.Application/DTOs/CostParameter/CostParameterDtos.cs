using System.ComponentModel.DataAnnotations;

namespace OhmERP.Application.DTOs.CostParameter;

public class CostParameterListDto
{
    public Guid Id { get; set; }

    [Display(Name = "Parametre Kodu")]
    public string Code { get; set; } = string.Empty;

    [Display(Name = "Parametre Adı")]
    public string Name { get; set; } = string.Empty;

    [Display(Name = "Yüzde Değeri (%)")]
    public decimal PercentageValue { get; set; }

    [Display(Name = "Açıklama")]
    public string? Description { get; set; }

    [Display(AutoGenerateField = false)]
    public bool IsSystemDefined { get; set; }
}

public class CreateCostParameterRequest
{
    [Required(ErrorMessage = "Parametre Kodu zorunludur.")]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Parametre Adı zorunludur.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Yüzde Değeri zorunludur.")]
    public decimal PercentageValue { get; set; }

    public string? Description { get; set; }
}

public class UpdateCostParameterRequest : CreateCostParameterRequest
{
    public Guid Id { get; set; }
}
