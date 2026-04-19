using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.Interfaces.Services;

namespace OhmERP.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public abstract class BaseCrudController<TDto, TCreateRequest, TUpdateRequest> : ControllerBase
{
    protected readonly ICrudService<TDto, TCreateRequest, TUpdateRequest> _service;
    protected abstract string ReportName { get; }

    protected BaseCrudController(ICrudService<TDto, TCreateRequest, TUpdateRequest> service)
    {
        _service = service;
    }

    protected virtual async Task<IActionResult> GetAllBase(PaginationFilter filter)
    {
        var result = await _service.GetPagedAsync(filter);
        return Ok(result);
    }

    protected virtual async Task<IActionResult> GetByIdBase(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        return Ok(result);
    }

    protected virtual async Task<IActionResult> CreateBase([FromBody] TCreateRequest request)
    {
        var id = await _service.CreateAsync(request);
        return Ok(new { id, message = "Kayıt başarıyla oluşturuldu." });
    }

    protected virtual async Task<IActionResult> UpdateBase(Guid id, [FromBody] TUpdateRequest request)
    {
        await _service.UpdateAsync(id, request);
        return Ok(new { message = "Kayıt başarıyla güncellendi." });
    }

    protected virtual async Task<IActionResult> DeleteBase(Guid id)
    {
        await _service.DeleteAsync(id);
        return Ok(new { message = "Kayıt başarıyla silindi." });
    }

    protected virtual async Task<IActionResult> ExportToExcelBase(PaginationFilter filter)
    {
        var fileBytes = await _service.ExportToExcelAsync(ReportName, filter);
        var contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        var fileName = $"{ReportName.Replace(" ", "")}_{DateTime.Now:yyyyMMdd_HHmm}.xlsx";

        return File(fileBytes, contentType, fileName);
    }

    protected virtual async Task<IActionResult> ExportToPdfBase(PaginationFilter filter)
    {
        var fileBytes = await _service.ExportToPdfAsync(ReportName, filter);
        var contentType = "application/pdf";
        var fileName = $"{ReportName.Replace(" ", "")}_{DateTime.Now:yyyyMMdd_HHmm}.pdf";

        return File(fileBytes, contentType, fileName);
    }
}