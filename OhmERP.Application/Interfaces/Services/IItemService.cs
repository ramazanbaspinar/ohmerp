using OhmERP.Application.DTOs.Item;

namespace OhmERP.Application.Interfaces.Services;

public interface IItemService : ICrudService<ItemListDto, CreateItemRequest, UpdateItemRequest>
{
    Task<UpdateItemRequest> GetForUpdateAsync(Guid id);
}