using OhmERP.Application.DTOs.District;

namespace OhmERP.Application.Interfaces.Services;

public interface IDistrictService : ICrudService<DistrictDto, CreateDistrictRequest, UpdateDistrictRequest>
{
    Task<List<DistrictDto>> GetByCityIdAsync(Guid cityId);
}