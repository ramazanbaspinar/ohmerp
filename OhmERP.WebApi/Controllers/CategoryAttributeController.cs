using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.CategoryAttribute;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.Interfaces.Services;

namespace OhmERP.WebApi.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class CategoryAttributeController : BaseCrudController<CategoryAttributeDto, CreateCategoryAttributeRequest, UpdateCategoryAttributeRequest>
{
    private readonly ICategoryAttributeService _attributeService;

    protected override string ReportName => "Kategori Özellik Listesi";

    public CategoryAttributeController(ICategoryAttributeService service) : base(service)
    {
        _attributeService = service;
    }

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] PaginationFilter filter) => GetAllBase(filter);

    [HttpGet("{id}")]
    public Task<IActionResult> GetById(Guid id) => GetByIdBase(id);

    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateCategoryAttributeRequest request) => CreateBase(request);

    [HttpPut("{id}")]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryAttributeRequest request) => UpdateBase(id, request);

    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(Guid id) => DeleteBase(id);

    [HttpGet("byCategory/{categoryId}")]
    public async Task<IActionResult> GetByCategory(Guid categoryId)
    {
        var result = await _attributeService.GetAttributesByCategoryIdAsync(categoryId);
        return Ok(result);
    }
}
