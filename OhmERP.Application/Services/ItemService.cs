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

        await ValidateCreateAsync(request);
        var item = _mapper.Map<Item>(request);
        item.AttributeValues = new List<ItemAttributeValue>();

        if (request.DynamicAttributes != null && request.DynamicAttributes.Any())
        {
            foreach (var attr in request.DynamicAttributes)
            {
                item.AttributeValues.Add(new ItemAttributeValue
                {
                    CategoryAttributeId = attr.CategoryAttributeId,
                    StringValue = attr.StringValue,
                    DecimalValue = attr.DecimalValue
                });
            }
        }

        await _repository.AddAsync(item);
        await _unitOfWork.SaveChangesAsync();
        await _cacheService.RemoveByPrefixAsync(CacheKey);

        return item.Id;
    }

    public override async Task UpdateAsync(Guid id, UpdateItemRequest request)
    {
        await base.UpdateAsync(id, request);

        if (request.DynamicAttributes != null)
        {
            var items = await _repository.FindWithQueryAsync(query => query.Include(x => x.AttributeValues).Where(x => x.Id == id));
            var item = items.FirstOrDefault();

            if (item != null)
            {
                var incomingAttrIds = request.DynamicAttributes.Select(x => x.CategoryAttributeId).ToList();
                
                var toRemove = item.AttributeValues.Where(x => !incomingAttrIds.Contains(x.CategoryAttributeId)).ToList();
                foreach (var r in toRemove)
                {
                    item.AttributeValues.Remove(r);
                }

                foreach (var attr in request.DynamicAttributes)
                {
                    var existing = item.AttributeValues.FirstOrDefault(x => x.CategoryAttributeId == attr.CategoryAttributeId);
                    if (existing != null)
                    {
                        existing.StringValue = attr.StringValue;
                        existing.DecimalValue = attr.DecimalValue;
                    }
                    else
                    {
                        item.AttributeValues.Add(new ItemAttributeValue
                        {
                            Id = Guid.Empty,
                            ItemId = item.Id,
                            CategoryAttributeId = attr.CategoryAttributeId,
                            StringValue = attr.StringValue,
                            DecimalValue = attr.DecimalValue
                        });
                    }
                }

                _repository.Update(item);
                await _unitOfWork.SaveChangesAsync();
            }
        }
    }

    public override async Task DeleteAsync(Guid id)
    {
        var entities = await _repository.FindWithQueryAsync(query => query.Include(x => x.AttributeValues).Where(x => x.Id == id));
        var item = entities.FirstOrDefault();
        
        if (item == null) throw new BusinessException("Malzeme bulunamadı.");
        if (item.IsDeleted) throw new BusinessException("Malzeme zaten silinmiş.");

        if (item.AttributeValues != null)
        {
            foreach (var attr in item.AttributeValues)
            {
                attr.IsDeleted = true;
            }
        }

        _repository.Remove(item);
        await _unitOfWork.SaveChangesAsync();
        await _cacheService.RemoveByPrefixAsync(CacheKey);
    }

    protected override Func<IQueryable<Item>, IQueryable<Item>> BuildFilter(PaginationFilter filter)
    {
        return query =>
        {
            query = query.Include(x => x.Category).Include(x => x.UnitOfMeasure).Include(x => x.AttributeValues);

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

            if (filter.CategoryId.HasValue)
            {
                query = query.Where(x => x.CategoryId == filter.CategoryId.Value);
            }

            return query;
        };
    }

    public async Task<UpdateItemRequest> GetForUpdateAsync(Guid id)
    {
        var entities = await _repository.FindWithQueryAsync(query => query.Include(x => x.AttributeValues).Where(x => x.Id == id));
        var entity = entities.FirstOrDefault();
            
        if (entity == null || entity.IsDeleted)
            throw new BusinessException("Malzeme bulunamadı.");

        var request = _mapper.Map<UpdateItemRequest>(entity);
        
        if (entity.AttributeValues != null && entity.AttributeValues.Any())
        {
            request.DynamicAttributes = entity.AttributeValues.Select(x => new OhmERP.Application.DTOs.ItemAttributeValue.ItemAttributeValueDto
            {
                Id = x.Id,
                CategoryAttributeId = x.CategoryAttributeId,
                StringValue = x.StringValue,
                DecimalValue = x.DecimalValue
            }).ToList();
        }

        return request;
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
