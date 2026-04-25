using AutoMapper;
using OhmERP.Application.DTOs.CostParameter;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;
using OhmERP.Domain.Exceptions;

namespace OhmERP.Application.Services;

public class CostParameterService : BaseService<CostParameter, CostParameterListDto, CreateCostParameterRequest, UpdateCostParameterRequest>, ICostParameterService
{
    protected override string CacheKey => "cost_parameter_list_all";

    public CostParameterService(IGenericRepository<CostParameter> repository, IUnitOfWork unitOfWork, IMapper mapper, ICacheService cacheService)
        : base(repository, unitOfWork, mapper, cacheService)
    {
    }

    protected override Func<IQueryable<CostParameter>, IQueryable<CostParameter>> BuildFilter(PaginationFilter filter)
    {
        return query =>
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => (x.Code != null && x.Code.Contains(filter.Search)) ||
                                         (x.Name != null && x.Name.Contains(filter.Search)));
            }

            return query.OrderBy(x => x.Name);
        };
    }

    protected override async Task ValidateCreateAsync(CreateCostParameterRequest request)
    {
        var code = request.Code.Trim();
        var conflictCheck = await _repository.FindAsync(x => x.Code == code);

        if (conflictCheck.Any(x => !x.IsDeleted))
            throw new BusinessException("Bu Parametre Kodu aktif olarak kullanılmaktadır.");
    }

    protected override async Task ValidateUpdateAsync(Guid id, UpdateCostParameterRequest request, CostParameter entity)
    {
        if (entity.IsSystemDefined && entity.Code != request.Code)
            throw new BusinessException("Sistem parametrelerinin kodu (Code) değiştirilemez.");

        var code = request.Code.Trim();
        var conflictCheck = await _repository.FindAsync(x => x.Id != id && x.Code == code);

        if (conflictCheck.Any(x => !x.IsDeleted))
            throw new BusinessException("Bu Parametre Kodu başka bir kayıtta kullanılmaktadır.");
    }

    public override async Task DeleteAsync(Guid id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null) throw new BusinessException("CostParameter bulunamadı.");
        if (entity.IsSystemDefined) throw new BusinessException("Sistem parametreleri silinemez!");
        
        await base.DeleteAsync(id);
    }
}
