using AutoMapper;
using OhmERP.Application.DTOs.BOM;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.DTOs.Common;
using OhmERP.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace OhmERP.Application.Services;

public class BOMService : BaseService<BOM, BOMDto, CreateBOMRequest, UpdateBOMRequest>, IBOMService
{
    protected override string CacheKey => "bom_list_all";

    public BOMService(
        IGenericRepository<BOM> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICacheService cacheService)
        : base(repository, unitOfWork, mapper, cacheService)
    {
    }

    protected override Func<IQueryable<BOM>, IQueryable<BOM>> BuildFilter(PaginationFilter filter)
    {
        return query =>
        {
            query = query.Include(x => x.Item);
            
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

    public override async Task<BOMDto> GetByIdAsync(Guid id)
    {
        var entities = await _repository.FindWithQueryAsync(query => query
            .Include(x => x.Item)
            .Include(x => x.BOMLines)
            .Include(x => x.BOMOperations)
            .Where(x => x.Id == id && !x.IsDeleted));

        var entity = entities.FirstOrDefault();
        if (entity == null) throw new BusinessException("BOM bulunamadı.");

        return _mapper.Map<BOMDto>(entity);
    }

    public override async Task<Guid> CreateAsync(CreateBOMRequest request)
    {
        var entity = _mapper.Map<BOM>(request);
        
        foreach(var line in request.BOMLines)
        {
            var bomLine = new BOMLine
            {
                MaterialId = line.MaterialId,
                UnitOfMeasureId = line.UnitOfMeasureId,
                Quantity = line.Quantity,
                ScrapRate = line.ScrapRate
            };
            entity.BOMLines.Add(bomLine);
        }

        foreach(var op in request.BOMOperations)
        {
            var bomOp = new BOMOperation
            {
                WorkCenterId = op.WorkCenterId,
                OperationOrder = op.OperationOrder,
                SetupTime = op.SetupTime,
                RunTime = op.RunTime
            };
            entity.BOMOperations.Add(bomOp);
        }

        await _repository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        await _cacheService.RemoveByPrefixAsync(CacheKey);
        
        return entity.Id;
    }

    public override async Task UpdateAsync(Guid id, UpdateBOMRequest request)
    {
        var entities = await _repository.FindWithQueryAsync(query => query
            .Include(x => x.BOMLines)
            .Include(x => x.BOMOperations)
            .Where(x => x.Id == id && !x.IsDeleted));

        var entity = entities.FirstOrDefault();
        if (entity == null) throw new BusinessException("BOM bulunamadı.");

        _mapper.Map(request, entity);

        // Merge BOMLines
        foreach (var existingLine in entity.BOMLines.ToList())
        {
            if (!request.BOMLines.Any(x => x.Id == existingLine.Id))
            {
                entity.BOMLines.Remove(existingLine);
            }
        }
        foreach (var lineReq in request.BOMLines)
        {
            var existingLine = entity.BOMLines.FirstOrDefault(x => x.Id == lineReq.Id && lineReq.Id != null && lineReq.Id != Guid.Empty);
            if (existingLine != null)
            {
                existingLine.MaterialId = lineReq.MaterialId;
                existingLine.UnitOfMeasureId = lineReq.UnitOfMeasureId;
                existingLine.Quantity = lineReq.Quantity;
                existingLine.ScrapRate = lineReq.ScrapRate;
            }
            else
            {
                entity.BOMLines.Add(new BOMLine
                {
                    MaterialId = lineReq.MaterialId,
                    UnitOfMeasureId = lineReq.UnitOfMeasureId,
                    Quantity = lineReq.Quantity,
                    ScrapRate = lineReq.ScrapRate
                });
            }
        }

        // Merge BOMOperations
        foreach (var existingOp in entity.BOMOperations.ToList())
        {
            if (!request.BOMOperations.Any(x => x.Id == existingOp.Id))
            {
                entity.BOMOperations.Remove(existingOp);
            }
        }
        foreach (var opReq in request.BOMOperations)
        {
            var existingOp = entity.BOMOperations.FirstOrDefault(x => x.Id == opReq.Id && opReq.Id != null && opReq.Id != Guid.Empty);
            if (existingOp != null)
            {
                existingOp.WorkCenterId = opReq.WorkCenterId;
                existingOp.OperationOrder = opReq.OperationOrder;
                existingOp.SetupTime = opReq.SetupTime;
                existingOp.RunTime = opReq.RunTime;
            }
            else
            {
                entity.BOMOperations.Add(new BOMOperation
                {
                    WorkCenterId = opReq.WorkCenterId,
                    OperationOrder = opReq.OperationOrder,
                    SetupTime = opReq.SetupTime,
                    RunTime = opReq.RunTime
                });
            }
        }

        _repository.Update(entity);
        await _unitOfWork.SaveChangesAsync();
        await _cacheService.RemoveByPrefixAsync(CacheKey);
    }
}
