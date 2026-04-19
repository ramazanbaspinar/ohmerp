using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Constants;
using OhmERP.WebApi.Security;

namespace OhmERP.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuditLogController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AuditLogController(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    [HttpGet]
    [HasPermission(Permissions.AuditLogs.View)]
    public async Task<IActionResult> GetLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? userId = null,
        [FromQuery] string? type = null,
        [FromQuery] string? tableName = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var pagedLogs = await _auditLogService.GetLogsAsync(page, pageSize, userId, type, tableName, startDate, endDate);
        return Ok(pagedLogs);
    }
}