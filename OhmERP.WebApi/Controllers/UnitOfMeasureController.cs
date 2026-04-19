using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.UnitOfMeasure;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Constants;
using OhmERP.WebApi.Security;

namespace OhmERP.WebApi.Controllers;

[Microsoft.AspNetCore.Authorization.Authorize]
public class UnitOfMeasureController : BaseCrudController<UnitOfMeasureListDto, CreateUnitOfMeasureRequest, UpdateUnitOfMeasureRequest>
{
    private readonly IUnitOfMeasureService _uomService;

    protected override string ReportName => "Ölçü Birimleri Listesi";

    public UnitOfMeasureController(IUnitOfMeasureService uomService) : base(uomService)
    {
        _uomService = uomService;
    }

    [HttpGet]
    [HasPermission(Permissions.UnitOfMeasures.View)]
    public Task<IActionResult> GetAll([FromQuery] PaginationFilter filter) => GetAllBase(filter);

    [HttpGet("lookup")]
    public async Task<IActionResult> GetLookup()
    {
        var result = await _uomService.GetLookupAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    [HasPermission(Permissions.UnitOfMeasures.View)]
    public Task<IActionResult> GetById(Guid id) => GetByIdBase(id);

    [HttpPost]
    [HasPermission(Permissions.UnitOfMeasures.Create)]
    public Task<IActionResult> Create([FromBody] CreateUnitOfMeasureRequest request) => CreateBase(request);

    [HttpPut("{id}")]
    [HasPermission(Permissions.UnitOfMeasures.Edit)]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateUnitOfMeasureRequest request) => UpdateBase(id, request);

    [HttpDelete("{id}")]
    [HasPermission(Permissions.UnitOfMeasures.Delete)]
    public Task<IActionResult> Delete(Guid id) => DeleteBase(id);

    [HttpGet("export/excel")]
    public Task<IActionResult> ExportToExcel([FromQuery] PaginationFilter filter) => ExportToExcelBase(filter);

    [HttpGet("export/pdf")]
    public Task<IActionResult> ExportToPdf([FromQuery] PaginationFilter filter) => ExportToPdfBase(filter);
}