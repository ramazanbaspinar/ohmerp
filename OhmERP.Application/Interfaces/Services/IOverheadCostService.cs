using OhmERP.Application.DTOs.OverheadCost;
using OhmERP.Application.DTOs.Common;

namespace OhmERP.Application.Interfaces.Services;

public interface IOverheadCostService : ICrudService<OverheadCostListDto, CreateOverheadCostRequest, UpdateOverheadCostRequest>
{
}
