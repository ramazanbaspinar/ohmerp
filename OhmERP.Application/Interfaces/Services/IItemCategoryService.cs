using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.ItemCategory;

namespace OhmERP.Application.Interfaces.Services;

public interface IItemCategoryService : ICrudService<ItemCategoryListDto, CreateItemCategoryRequest, UpdateItemCategoryRequest>
{
    Task<List<LookupDto>> GetLookupAsync();
    Task<UpdateItemCategoryRequest> GetForUpdateAsync(Guid id);
}