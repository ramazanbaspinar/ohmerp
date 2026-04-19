using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class District : AuditableEntity
{
    public string Name { get; set; } = string.Empty;

    public Guid CityId { get; set; }
    public City? City { get; set; }
}