namespace OhmERP.Application.DTOs.District;

public class UpdateDistrictRequest
{
    public string Name { get; set; } = string.Empty;
    public Guid CityId { get; set; }
}