using OhmERP.Domain.Enums;

namespace OhmERP.Application.DTOs;

public class CreateTechnicalParameterDto
{
    public TechnicalParameterType ParameterType { get; set; }
    public decimal NumericValue { get; set; }
    public string Description { get; set; } = string.Empty;
}
