using OhmERP.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace OhmERP.Application.DTOs;

public class TechnicalParameterDto
{
    public Guid Id { get; set; }

    [Display(AutoGenerateField = false)]
    public TechnicalParameterType ParameterType { get; set; }

    [Display(Name = "Kodu")]
    public string Code { get; set; } = string.Empty;

    [Display(Name = "Değeri (Volt/Watt)")]
    public decimal NumericValue { get; set; }

    [Display(Name = "Açıklama")]
    public string Description { get; set; } = string.Empty;
}
