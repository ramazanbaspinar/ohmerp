using OhmERP.Domain.Enums;

namespace OhmERP.Application.DTOs;

public class UpdateTechnicalParameterDto
{
    public Guid Id { get; set; }
    public TechnicalParameterType ParameterType { get; set; }
    public decimal NumericValue { get; set; }
    public string Description { get; set; } = string.Empty;
}
