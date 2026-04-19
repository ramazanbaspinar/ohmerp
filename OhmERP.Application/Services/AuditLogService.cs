using AutoMapper;
using OhmERP.Application.DTOs.AuditLog;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;

namespace OhmERP.Application.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IGenericRepository<AuditLog> _repository;
    private readonly IMapper _mapper;

    public AuditLogService(IGenericRepository<AuditLog> repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<PagedResult<AuditLogDto>> GetLogsAsync(int page, int pageSize, Guid? userId, string? type, string? tableName, DateTime? startDate, DateTime? endDate)
    {
        DateTime? safeStartDate = startDate?.ToUniversalTime();
        DateTime? safeEndDate = endDate?.ToUniversalTime();

        var pagedData = await _repository.GetPagedAsync(
            page,
            pageSize,
            predicate: log =>
                (!userId.HasValue || log.UserId == userId) &&
                (string.IsNullOrEmpty(type) || log.Type == type) &&
                (string.IsNullOrEmpty(tableName) || log.TableName.Contains(tableName)) &&
                (!safeStartDate.HasValue || log.DateTime >= safeStartDate.Value) &&
                (!safeEndDate.HasValue || log.DateTime <= safeEndDate.Value),
            orderBy: q => q.OrderByDescending(x => x.DateTime)
        );

        var dtos = _mapper.Map<List<AuditLogDto>>(pagedData.Items);

        return new PagedResult<AuditLogDto>
        {
            Items = dtos,
            TotalCount = pagedData.TotalCount,
            PageNumber = pagedData.PageNumber,
            PageSize = pagedData.PageSize,
            TotalPages = pagedData.TotalPages
        };
    }
}