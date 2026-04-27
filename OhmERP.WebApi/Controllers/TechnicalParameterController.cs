using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.Interfaces.Services;

namespace OhmERP.WebApi.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class TechnicalParameterController : ControllerBase
{
    private readonly ITechnicalParameterService _technicalParameterService;

    public TechnicalParameterController(ITechnicalParameterService technicalParameterService)
    {
        _technicalParameterService = technicalParameterService;
    }

    [HttpGet]
    [Authorize(Policy = "Permissions.Items.View")]
    public async Task<IActionResult> GetAll([FromQuery] PaginationFilter filter)
    {
        var result = await _technicalParameterService.GetPagedAsync(filter);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "Permissions.Items.View")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _technicalParameterService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "Permissions.Items.Create")]
    public async Task<IActionResult> Create([FromBody] CreateTechnicalParameterDto createDto)
    {
        var id = await _technicalParameterService.CreateAsync(createDto);
        return Ok(new { Id = id });
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "Permissions.Items.Edit")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTechnicalParameterDto updateDto)
    {
        await _technicalParameterService.UpdateAsync(id, updateDto);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "Permissions.Items.Delete")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _technicalParameterService.DeleteAsync(id);
        return NoContent();
    }

    [HttpGet("export/excel")]
    [Authorize(Policy = "Permissions.Items.View")]
    public async Task<IActionResult> ExportExcel([FromQuery] PaginationFilter filter)
    {
        var fileContent = await _technicalParameterService.ExportToExcelAsync("TeknikParametreler", filter);
        return File(fileContent, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "TeknikParametreler.xlsx");
    }

    [HttpGet("export/pdf")]
    [Authorize(Policy = "Permissions.Items.View")]
    public async Task<IActionResult> ExportPdf([FromQuery] PaginationFilter filter)
    {
        var fileContent = await _technicalParameterService.ExportToPdfAsync("Teknik Parametreler Listesi", filter);
        return File(fileContent, "application/pdf", "TeknikParametreler.pdf");
    }
}
