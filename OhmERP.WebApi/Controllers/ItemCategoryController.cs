using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.ItemCategory;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Constants;
using OhmERP.WebApi.Security;

namespace OhmERP.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ItemCategoryController : BaseCrudController<ItemCategoryListDto, CreateItemCategoryRequest, UpdateItemCategoryRequest>
{
    private readonly IItemCategoryService _categoryService;

    protected override string ReportName => "Malzeme Kategori Listesi";

    public ItemCategoryController(IItemCategoryService categoryService) : base(categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    [HasPermission(Permissions.ItemCategories.View)]
    public Task<IActionResult> GetAll([FromQuery] PaginationFilter filter) => GetAllBase(filter);

    [HttpGet("lookup")]
    public async Task<IActionResult> GetLookup()
    {
        var result = await _categoryService.GetLookupAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    [HasPermission(Permissions.ItemCategories.View)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _categoryService.GetForUpdateAsync(id);
        return Ok(result);
    }

    [HttpPost]
    [HasPermission(Permissions.ItemCategories.Create)]
    public Task<IActionResult> Create([FromBody] CreateItemCategoryRequest request) => CreateBase(request);

    [HttpPut("{id}")]
    [HasPermission(Permissions.ItemCategories.Edit)]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateItemCategoryRequest request) => UpdateBase(id, request);

    [HttpDelete("{id}")]
    [HasPermission(Permissions.ItemCategories.Delete)]
    public Task<IActionResult> Delete(Guid id) => DeleteBase(id);

    [HttpGet("export/excel")]
    public Task<IActionResult> ExportToExcel([FromQuery] PaginationFilter filter) => ExportToExcelBase(filter);

    [HttpGet("export/pdf")]
    public Task<IActionResult> ExportToPdf([FromQuery] PaginationFilter filter) => ExportToPdfBase(filter);
}