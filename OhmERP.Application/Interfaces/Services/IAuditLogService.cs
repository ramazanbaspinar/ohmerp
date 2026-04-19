using OhmERP.Application.DTOs.AuditLog;
using OhmERP.Application.DTOs.Common;

namespace OhmERP.Application.Interfaces.Services;

public interface IAuditLogService
{
    Task<PagedResult<AuditLogDto>> GetLogsAsync(int page, int pageSize, Guid? userId, string? type, string? tableName, DateTime? startDate, DateTime? endDate);
}