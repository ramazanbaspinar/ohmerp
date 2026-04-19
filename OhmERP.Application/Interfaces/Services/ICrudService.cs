using OhmERP.Application.DTOs.Common;

namespace OhmERP.Application.Interfaces.Services;

public interface ICrudService<TDto, TCreateRequest, TUpdateRequest>
{
    Task<List<TDto>> GetAllAsync();
    Task<PagedResult<TDto>> GetPagedAsync(PaginationFilter filter);
    Task<TDto> GetByIdAsync(Guid id);
    Task<Guid> CreateAsync(TCreateRequest request);
    Task UpdateAsync(Guid id, TUpdateRequest request);
    Task DeleteAsync(Guid id);
    Task<byte[]> ExportToExcelAsync(string reportName = "Dışa Aktarım", PaginationFilter? filter = null);
    Task<byte[]> ExportToPdfAsync(string reportName = "Sistem Çıktısı", PaginationFilter? filter = null);
}