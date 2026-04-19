namespace OhmERP.Application.DTOs.District;

public class CreateDistrictRequest
{
    public string Name { get; set; } = string.Empty;
    public Guid CityId { get; set; }
}