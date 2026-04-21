using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OhmERP.Application.DTOs.CategoryAttribute;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;

namespace OhmERP.Application.Services;

public class CategoryAttributeService : BaseService<CategoryAttribute, CategoryAttributeDto, CreateCategoryAttributeRequest, UpdateCategoryAttributeRequest>, ICategoryAttributeService
{
    protected override string CacheKey => "category_attribute_list";

    public CategoryAttributeService(
        IGenericRepository<CategoryAttribute> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICacheService cacheService)
        : base(repository, unitOfWork, mapper, cacheService)
    {
    }

    public async Task<List<CategoryAttributeDto>> GetAttributesByCategoryIdAsync(Guid categoryId)
    {
        var attributes = await _repository.FindWithQueryAsync(
            query => query.Where(x => x.ItemCategoryId == categoryId && !x.IsDeleted),
            orderBy => orderBy.OrderBy(x => x.SortOrder).ThenBy(x => x.Name)
        );

        return _mapper.Map<List<CategoryAttributeDto>>(attributes);
    }
}
