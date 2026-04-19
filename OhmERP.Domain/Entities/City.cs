using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class City : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string PlateCode { get; set; } = string.Empty;

    public ICollection<District> Districts { get; set; } = new List<District>();
}