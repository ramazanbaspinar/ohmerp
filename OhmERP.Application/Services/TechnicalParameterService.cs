using AutoMapper;
using OhmERP.Application.DTOs;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;
using OhmERP.Domain.Enums;
using OhmERP.Domain.Exceptions;

namespace OhmERP.Application.Services;

public class TechnicalParameterService : BaseService<TechnicalParameter, TechnicalParameterDto, CreateTechnicalParameterDto, UpdateTechnicalParameterDto>, ITechnicalParameterService
{
    private readonly INumeratorService _numeratorService;

    protected override string CacheKey => "technical_parameter_list";

    public TechnicalParameterService(IGenericRepository<TechnicalParameter> repository, IUnitOfWork unitOfWork, IMapper mapper, ICacheService cacheService, INumeratorService numeratorService)
        : base(repository, unitOfWork, mapper, cacheService)
    {
        _numeratorService = numeratorService;
    }

    protected override Func<IQueryable<TechnicalParameter>, IQueryable<TechnicalParameter>> BuildFilter(PaginationFilter filter)
    {
        return query =>
        {
            if (filter.Type.HasValue)
            {
                query = query.Where(x => (int)x.ParameterType == filter.Type.Value);
            }

            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => (x.Code != null && x.Code.Contains(filter.Search)) ||
                                         (x.Description != null && x.Description.Contains(filter.Search)));
            }

            return query.OrderBy(x => x.Code);
        };
    }

    public override async Task<Guid> CreateAsync(CreateTechnicalParameterDto createDto)
    {
        var entity = _mapper.Map<TechnicalParameter>(createDto);
        entity.Code = await _numeratorService.GenerateNextCodeAsync(DocumentType.TechnicalParameter);

        await _repository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        await _cacheService.RemoveByPrefixAsync(CacheKey);

        return entity.Id;
    }
}
