using AutoMapper;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.UnitOfMeasure;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;
using OhmERP.Domain.Exceptions;

namespace OhmERP.Application.Services;

public class UnitOfMeasureService : BaseService<UnitOfMeasure, UnitOfMeasureListDto, CreateUnitOfMeasureRequest, UpdateUnitOfMeasureRequest>, IUnitOfMeasureService
{
    protected override string CacheKey => "uom_list_all";

    private readonly IGenericRepository<Item> _itemRepository;

    public UnitOfMeasureService(
        IGenericRepository<UnitOfMeasure> repository,
        IGenericRepository<Item> itemRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICacheService cacheService)
        : base(repository, unitOfWork, mapper, cacheService)
    {
        _itemRepository = itemRepository;
    }

    public override async Task DeleteAsync(Guid id)
    {
        if (await _itemRepository.AnyAsync(x => x.UnitOfMeasureId == id && !x.IsDeleted))
            throw new RelationExistsException("Seçilen ölçü birimi malzemelerde kullanılmaktadır, silinemez.");
            
        await base.DeleteAsync(id);
    }

    protected override Func<IQueryable<UnitOfMeasure>, IQueryable<UnitOfMeasure>> BuildFilter(PaginationFilter filter)
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

    public async Task<List<LookupDto>> GetLookupAsync()
    {
        var entities = await _repository.FindAsync(x => x.IsActive && !x.IsDeleted);
        return entities.Select(u => new LookupDto
        {
            Id = u.Id,
            Name = $"{u.Code} - {u.Name}"
        }).OrderBy(x => x.Name).ToList();
    }

    public async Task<UpdateUnitOfMeasureRequest> GetForUpdateAsync(Guid id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null || entity.IsDeleted)
            throw new BusinessException("Ölçü birimi bulunamadı.");

        return _mapper.Map<UpdateUnitOfMeasureRequest>(entity);
    }

    protected override async Task ValidateCreateAsync(CreateUnitOfMeasureRequest request)
    {
        var requestTargetCode = request.Code?.Trim();
        if (await _repository.AnyAsync(x => x.Code != null && x.Code == requestTargetCode && !x.IsDeleted))
            throw new BusinessException("Girilen sistem kodu zaten başka bir kayıtta kullanılmaktadır. Lütfen farklı bir kod giriniz."); 
    }

    protected override async Task ValidateUpdateAsync(Guid id, UpdateUnitOfMeasureRequest request, UnitOfMeasure entity)
    {
        var requestTargetCode = request.Code?.Trim();
        if (await _repository.AnyAsync(x => x.Code != null && x.Code == requestTargetCode && x.Id != id && !x.IsDeleted))
            throw new BusinessException("Girilen sistem kodu zaten başka bir kayıtta kullanılmaktadır. Lütfen farklı bir kod giriniz."); 
    }
}
