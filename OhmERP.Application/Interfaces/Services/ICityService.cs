using OhmERP.Application.DTOs.City;

namespace OhmERP.Application.Interfaces.Services;

public interface ICityService : ICrudService<CityDto, CreateCityRequest, UpdateCityRequest>
{
}