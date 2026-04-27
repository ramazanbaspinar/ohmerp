using OhmERP.Domain.Common;
using OhmERP.Domain.Enums;

namespace OhmERP.Domain.Entities;

public class TechnicalParameter : AuditableEntity
{
    public TechnicalParameterType ParameterType { get; set; }
    public string Code { get; set; } = string.Empty;
    public decimal NumericValue { get; set; }
    public string Description { get; set; } = string.Empty;
}
