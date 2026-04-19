using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.UnitOfMeasure;

namespace OhmERP.Application.Interfaces.Services;

public interface IUnitOfMeasureService : ICrudService<UnitOfMeasureListDto, CreateUnitOfMeasureRequest, UpdateUnitOfMeasureRequest>
{
    Task<List<LookupDto>> GetLookupAsync();
    Task<UpdateUnitOfMeasureRequest> GetForUpdateAsync(Guid id);
}