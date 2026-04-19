using System.ComponentModel.DataAnnotations;

namespace OhmERP.Application.DTOs.District;

public class DistrictDto
{
    public Guid Id { get; set; }

    [Display(Name = "İlçe Adı")]
    public string Name { get; set; } = string.Empty;

    public Guid CityId { get; set; }

    [Display(Name = "İl Adı")]
    public string CityName { get; set; } = string.Empty;
}