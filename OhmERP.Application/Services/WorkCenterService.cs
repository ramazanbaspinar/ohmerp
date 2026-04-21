using AutoMapper;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.WorkCenter;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;
using OhmERP.Domain.Exceptions;

namespace OhmERP.Application.Services;

public class WorkCenterService : BaseService<WorkCenter, WorkCenterListDto, CreateWorkCenterRequest, UpdateWorkCenterRequest>, IWorkCenterService
{
    protected override string CacheKey => "workcenter_list_all";

    public WorkCenterService(
        IGenericRepository<WorkCenter> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICacheService cacheService)
        : base(repository, unitOfWork, mapper, cacheService)
    {
    }

    protected override Func<IQueryable<WorkCenter>, IQueryable<WorkCenter>> BuildFilter(PaginationFilter filter)
    {
        return query =>
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => (x.Code != null && x.Code.Contains(filter.Search)) ||
                                         (x.Name != null && x.Name.Contains(filter.Search)));
            }

            if (filter.IsActive.HasValue)
            {
                query = query.Where(x => x.IsActive == filter.IsActive.Value);
            }

            return query;
        };
    }

    protected override async Task ValidateCreateAsync(CreateWorkCenterRequest request)
    {
        if (await _repository.AnyAsync(x => x.Code == request.Code.Trim() && !x.IsDeleted))
            throw new BusinessException("Aynı Kodla başka makine olamaz.");
    }

    protected override async Task ValidateUpdateAsync(Guid id, UpdateWorkCenterRequest request, WorkCenter entity)
    {
        if (await _repository.AnyAsync(x => x.Code == request.Code.Trim() && x.Id != id && !x.IsDeleted))
            throw new BusinessException("Aynı Kodla başka makine olamaz.");
    }
}
