using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.OverheadCost;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Constants;
using OhmERP.WebApi.Security;

namespace OhmERP.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OverheadCostsController : BaseCrudController<OverheadCostListDto, CreateOverheadCostRequest, UpdateOverheadCostRequest>
{
    private readonly IOverheadCostService _overheadCostService;

    protected override string ReportName => "Genel Üretim Giderleri Listesi";

    public OverheadCostsController(IOverheadCostService overheadCostService) : base(overheadCostService)
    {
        _overheadCostService = overheadCostService;
    }

    [HttpGet]
    [HasPermission(Permissions.OverheadCosts.View)]
    public Task<IActionResult> GetAll([FromQuery] PaginationFilter filter) => GetAllBase(filter);

    [HttpGet("lookup")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLookup()
    {
        var costs = await _overheadCostService.GetAllAsync();
        var lookup = costs.Select(c => new { c.Id, c.Name, c.Code, c.MonthlyAmount }).OrderBy(c => c.Name);
        return Ok(lookup);
    }

    [HttpGet("{id}")]
    [HasPermission(Permissions.OverheadCosts.View)]
    public Task<IActionResult> GetById(Guid id) => GetByIdBase(id);

    [HttpPost]
    [HasPermission(Permissions.OverheadCosts.Create)]
    public Task<IActionResult> Create([FromBody] CreateOverheadCostRequest request) => CreateBase(request);

    [HttpPut("{id}")]
    [HasPermission(Permissions.OverheadCosts.Edit)]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateOverheadCostRequest request) => UpdateBase(id, request);

    [HttpDelete("{id}")]
    [HasPermission(Permissions.OverheadCosts.Delete)]
    public Task<IActionResult> Delete(Guid id) => DeleteBase(id);

    [HttpGet("export/excel")]
    public Task<IActionResult> ExportToExcel([FromQuery] PaginationFilter filter) => ExportToExcelBase(filter);

    [HttpGet("export/pdf")]
    public Task<IActionResult> ExportToPdf([FromQuery] PaginationFilter filter) => ExportToPdfBase(filter);
}
