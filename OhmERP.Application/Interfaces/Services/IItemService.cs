using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.Item;

namespace OhmERP.Application.Interfaces.Services;

public interface IItemService : ICrudService<ItemListDto, CreateItemRequest, UpdateItemRequest>
{
    Task<UpdateItemRequest> GetForUpdateAsync(Guid id);
    Task<List<LookupDto>> GetLookupWithoutCostAsync(string? categoryCode);
    Task UpdateItemCostAsync(Guid id, decimal unitCost, OhmERP.Domain.Enums.CurrencyType currency);
    Task ResetItemCostAsync(Guid id);
    Task<byte[]> ExportCostsToExcelAsync(string reportName = "Hammadde Maliyetleri", OhmERP.Application.DTOs.Common.PaginationFilter? filter = null);
    Task<byte[]> ExportCostsToPdfAsync(string reportName = "Hammadde Maliyetleri", OhmERP.Application.DTOs.Common.PaginationFilter? filter = null);
}