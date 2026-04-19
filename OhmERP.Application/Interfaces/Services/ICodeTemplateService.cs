using OhmERP.Application.DTOs.CodeTemplate;

namespace OhmERP.Application.Interfaces.Services;

public interface ICodeTemplateService
{
    Task<List<CodeTemplateDto>> GetAllAsync();
    Task UpdateAsync(Guid id, UpdateCodeTemplateRequest request);
    Task<byte[]> ExportToExcelAsync();
    Task<byte[]> ExportToPdfAsync();
}
