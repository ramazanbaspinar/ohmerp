using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.Item;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Constants;
using OhmERP.WebApi.Security;

namespace OhmERP.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ItemController : BaseCrudController<ItemListDto, CreateItemRequest, UpdateItemRequest>
{
    private readonly IItemService _itemService;

    protected override string ReportName => "Malzeme Kartları Listesi";

    public ItemController(IItemService itemService) : base(itemService)
    {
        _itemService = itemService;
    }

    [HttpGet]
    [HasPermission(Permissions.Items.View)]
    public Task<IActionResult> GetAll([FromQuery] PaginationFilter filter) => GetAllBase(filter);

    [HttpGet("{id}")]
    [HasPermission(Permissions.Items.View)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _itemService.GetForUpdateAsync(id);
        return Ok(result);
    }

    [HttpPost]
    [HasPermission(Permissions.Items.Create)]
    public Task<IActionResult> Create([FromBody] CreateItemRequest request) => CreateBase(request);

    [HttpPut("{id}")]
    [HasPermission(Permissions.Items.Edit)]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateItemRequest request) => UpdateBase(id, request);

    [HttpDelete("{id}")]
    [HasPermission(Permissions.Items.Delete)]
    public Task<IActionResult> Delete(Guid id) => DeleteBase(id);

    [HttpGet("export/excel")]
    public Task<IActionResult> ExportToExcel([FromQuery] PaginationFilter filter) => ExportToExcelBase(filter);

    [HttpGet("export/pdf")]
    public Task<IActionResult> ExportToPdf([FromQuery] PaginationFilter filter) => ExportToPdfBase(filter);

    [HttpGet("lookup-without-cost")]
    public async Task<IActionResult> GetLookupWithoutCost([FromQuery] string? categoryCode)
    {
        var result = await _itemService.GetLookupWithoutCostAsync(categoryCode);
        return Ok(result);
    }

    [HttpPut("{id}/cost")]
    [HasPermission(Permissions.Items.Edit)]
    public async Task<IActionResult> UpdateCost(Guid id, [FromBody] UpdateItemCostDto request)
    {
        await _itemService.UpdateItemCostAsync(id, request.UnitCost, request.Currency);
        return Ok(new { message = "Maliyet başarıyla güncellendi." });
    }

    [HttpDelete("{id}/cost")]
    [HasPermission(Permissions.Items.Edit)]
    public async Task<IActionResult> ResetCost(Guid id)
    {
        await _itemService.ResetItemCostAsync(id);
        return Ok(new { message = "Maliyet başarıyla silindi." });
    }

    [HttpGet("export-costs/excel")]
    public async Task<IActionResult> ExportCostsToExcel([FromQuery] PaginationFilter filter)
    {
        var fileBytes = await _itemService.ExportCostsToExcelAsync("Hammadde Maliyetleri", filter);
        return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"HammaddeMaliyetleri_{DateTime.Now:yyyyMMdd}.xlsx");
    }

    [HttpGet("export-costs/pdf")]
    public async Task<IActionResult> ExportCostsToPdf([FromQuery] PaginationFilter filter)
    {
        var fileBytes = await _itemService.ExportCostsToPdfAsync("Hammadde Maliyetleri", filter);
        return File(fileBytes, "application/pdf", $"HammaddeMaliyetleri_{DateTime.Now:yyyyMMdd}.pdf");
    }
}