using OhmERP.Domain.Exceptions;
using AutoMapper;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.ItemCategory;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using OhmERP.Domain.Entities;

namespace OhmERP.Application.Services;

public class ItemCategoryService : BaseService<ItemCategory, ItemCategoryListDto, CreateItemCategoryRequest, UpdateItemCategoryRequest>, IItemCategoryService
{
    protected override string CacheKey => "item_category_list_all";

    public ItemCategoryService(
        IGenericRepository<ItemCategory> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICacheService cacheService)
        : base(repository, unitOfWork, mapper, cacheService)
    {
    }

    protected override Func<IQueryable<ItemCategory>, IQueryable<ItemCategory>> BuildFilter(PaginationFilter filter)
    {
        return query =>
        {
            query = query.Include(x => x.Parent);

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
        var categories = await _repository.FindAsync(x => x.IsActive && !x.IsDeleted);
        return categories.Select(c => new LookupDto
        {
            Id = c.Id,
            Name = c.Name ?? string.Empty,
            DefaultUnitOfMeasureId = c.DefaultUnitOfMeasureId
        }).OrderBy(x => x.Name).ToList();
    }

    public async Task<UpdateItemCategoryRequest> GetForUpdateAsync(Guid id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null || entity.IsDeleted)
            throw new BusinessException("Kategori bulunamadı.");

        return _mapper.Map<UpdateItemCategoryRequest>(entity);
    }

    protected override async Task ValidateCreateAsync(CreateItemCategoryRequest request)
    {
        if (await _repository.AnyAsync(x => x.Code == request.Code.Trim() && !x.IsDeleted))
            throw new BusinessException("Girilen sistem kodu zaten başka bir kayıtta kullanılmaktadır. Lütfen farklı bir kod giriniz.");
    }

    protected override async Task ValidateUpdateAsync(Guid id, UpdateItemCategoryRequest request, ItemCategory entity)
    {
        if (await _repository.AnyAsync(x => x.Code == request.Code.Trim() && x.Id != id && !x.IsDeleted))
            throw new BusinessException("Girilen sistem kodu zaten başka bir kayıtta kullanılmaktadır. Lütfen farklı bir kod giriniz.");

        if (request.ParentId.HasValue && request.ParentId.Value == id)
            throw new BusinessException("Bir kategori kendisinin üst kategorisi olamaz.");
    }
}
