using OhmERP.Application.DTOs.CostParameter;
using OhmERP.Application.DTOs.Common;

namespace OhmERP.Application.Interfaces.Services;

public interface ICostParameterService : ICrudService<CostParameterListDto, CreateCostParameterRequest, UpdateCostParameterRequest>
{
}
