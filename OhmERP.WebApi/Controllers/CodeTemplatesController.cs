using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.CodeTemplate;
using OhmERP.Application.Interfaces.Services;

namespace OhmERP.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CodeTemplatesController : ControllerBase
{
    private readonly ICodeTemplateService _service;

    public CodeTemplatesController(ICodeTemplateService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCodeTemplateRequest request)
    {
        await _service.UpdateAsync(id, request);
        return NoContent();
    }

    [HttpGet("export/excel")]
    public async Task<IActionResult> ExportExcel()
    {
        var fileContent = await _service.ExportToExcelAsync();
        return File(fileContent, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "NumaratorSablonlari.xlsx");
    }

    [HttpGet("export/pdf")]
    public async Task<IActionResult> ExportPdf()
    {
        var fileContent = await _service.ExportToPdfAsync();
        return File(fileContent, "application/pdf", "NumaratorSablonlari.pdf");
    }
}
