using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.BOM;
using OhmERP.Application.Interfaces.Services;

namespace OhmERP.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BOMsController : BaseCrudController<BOMDto, CreateBOMRequest, UpdateBOMRequest>
{
    protected override string ReportName => "Ürün Reçeteleri Listesi";

    public BOMsController(IBOMService bomService) : base(bomService)
    {
    }

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] PaginationFilter filter) => GetAllBase(filter);

    [HttpGet("{id}")]
    public Task<IActionResult> GetById(Guid id) => GetByIdBase(id);

    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateBOMRequest request) => CreateBase(request);

    [HttpPut("{id}")]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateBOMRequest request) => UpdateBase(id, request);

    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(Guid id) => DeleteBase(id);
}
