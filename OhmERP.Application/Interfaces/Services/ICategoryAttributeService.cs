using OhmERP.Application.DTOs.CategoryAttribute;

namespace OhmERP.Application.Interfaces.Services;

public interface ICategoryAttributeService : ICrudService<CategoryAttributeDto, CreateCategoryAttributeRequest, UpdateCategoryAttributeRequest>
{
    Task<List<CategoryAttributeDto>> GetAttributesByCategoryIdAsync(Guid categoryId);
}
