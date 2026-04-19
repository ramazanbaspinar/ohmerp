using System.ComponentModel.DataAnnotations;

namespace OhmERP.Application.DTOs.City;

public class CityDto
{
    public Guid Id { get; set; }

    [Display(Name = "İl Adı")]
    public string Name { get; set; } = string.Empty;

    [Display(Name = "Plaka Kodu")]
    public string PlateCode { get; set; } = string.Empty;
}