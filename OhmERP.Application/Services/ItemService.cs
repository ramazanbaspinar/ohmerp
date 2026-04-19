using OhmERP.Domain.Exceptions;
using AutoMapper;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.Item;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using OhmERP.Domain.Entities;
using OhmERP.Domain.Enums;

namespace OhmERP.Application.Services;

public class ItemService : BaseService<Item, ItemListDto, CreateItemRequest, UpdateItemRequest>, IItemService
{
    protected override string CacheKey => "item_list_all";

    private readonly IGenericRepository<ItemCategory> _categoryRepository;
    private readonly IGenericRepository<UnitOfMeasure> _uomRepository;
    private readonly INumeratorService _numeratorService;

    public ItemService(
        IGenericRepository<Item> repository,
        IGenericRepository<ItemCategory> categoryRepository,
        IGenericRepository<UnitOfMeasure> uomRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICacheService cacheService,
        INumeratorService numeratorService)
        : base(repository, unitOfWork, mapper, cacheService)
    {
        _categoryRepository = categoryRepository;
        _uomRepository = uomRepository;
        _numeratorService = numeratorService;
    }

    public override async Task<Guid> CreateAsync(CreateItemRequest request)
    {
        var previewInfo = await _numeratorService.PreviewNextCodeAsync(DocumentType.Item);

        if (string.IsNullOrWhiteSpace(request.Code) || 
            request.Code.Trim() == "Yükleniyor..." || 
            request.Code.Trim() == previewInfo.NextCode)
        {
            request.Code = await _numeratorService.GenerateNextCodeAsync(DocumentType.Item);
        }

        return await base.CreateAsync(request);
    }

    protected override Func<IQueryable<Item>, IQueryable<Item>> BuildFilter(PaginationFilter filter)
    {
        return query =>
        {
            query = query.Include(x => x.Category).Include(x => x.UnitOfMeasure);

            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => (x.Code != null && x.Code.Contains(filter.Search)) ||
                                         (x.Name != null && x.Name.Contains(filter.Search)));
            }

            if (filter.IsActive.HasValue)
            {
                query = query.Where(x => x.IsActive == filter.IsActive.Value);
            }

            if (filter.Type.HasValue)
            {
                query = query.Where(x => (int)x.Type == filter.Type.Value);
            }

            return query;
        };
    }

    public async Task<UpdateItemRequest> GetForUpdateAsync(Guid id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null || entity.IsDeleted)
            throw new BusinessException("Malzeme bulunamadı.");

        return _mapper.Map<UpdateItemRequest>(entity);
    }

    protected override async Task ValidateCreateAsync(CreateItemRequest request)
    {
        if (await _repository.AnyAsync(x => x.Code == request.Code.Trim() && !x.IsDeleted))
            throw new BusinessException("Girilen sistem kodu zaten başka bir kayıtta kullanılmaktadır. Lütfen farklı bir kod giriniz.");
    }

    protected override async Task ValidateUpdateAsync(Guid id, UpdateItemRequest request, Item entity)
    {
        if (await _repository.AnyAsync(x => x.Code == request.Code.Trim() && x.Id != id && !x.IsDeleted))
            throw new BusinessException("Girilen sistem kodu zaten başka bir kayıtta kullanılmaktadır. Lütfen farklı bir kod giriniz.");
    }
}
