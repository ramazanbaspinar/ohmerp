using OhmERP.Application.DTOs.BOM;

namespace OhmERP.Application.Interfaces.Services;

public interface IBOMService : ICrudService<BOMDto, CreateBOMRequest, UpdateBOMRequest>
{
}
