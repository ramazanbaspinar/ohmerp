using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.CostParameter;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Constants;
using OhmERP.WebApi.Security;

namespace OhmERP.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CostParametersController : BaseCrudController<CostParameterListDto, CreateCostParameterRequest, UpdateCostParameterRequest>
{
    private readonly ICostParameterService _costParameterService;

    protected override string ReportName => "Maliyet Parametreleri Listesi";

    public CostParametersController(ICostParameterService costParameterService) : base(costParameterService)
    {
        _costParameterService = costParameterService;
    }

    [HttpGet]
    [HasPermission(Permissions.CostParameters.View)]
    public Task<IActionResult> GetAll([FromQuery] PaginationFilter filter) => GetAllBase(filter);

    [HttpGet("lookup")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLookup()
    {
        var parameters = await _costParameterService.GetAllAsync();
        var lookup = parameters.Select(c => new { c.Id, c.Name, c.Code, c.PercentageValue }).OrderBy(c => c.Name);
        return Ok(lookup);
    }

    [HttpGet("{id}")]
    [HasPermission(Permissions.CostParameters.View)]
    public Task<IActionResult> GetById(Guid id) => GetByIdBase(id);

    [HttpPost]
    [HasPermission(Permissions.CostParameters.Create)]
    public Task<IActionResult> Create([FromBody] CreateCostParameterRequest request) => CreateBase(request);

    [HttpPut("{id}")]
    [HasPermission(Permissions.CostParameters.Edit)]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateCostParameterRequest request) => UpdateBase(id, request);

    [HttpDelete("{id}")]
    [HasPermission(Permissions.CostParameters.Delete)]
    public Task<IActionResult> Delete(Guid id) => DeleteBase(id);

    [HttpGet("export/excel")]
    public Task<IActionResult> ExportToExcel([FromQuery] PaginationFilter filter) => ExportToExcelBase(filter);

    [HttpGet("export/pdf")]
    public Task<IActionResult> ExportToPdf([FromQuery] PaginationFilter filter) => ExportToPdfBase(filter);
}
