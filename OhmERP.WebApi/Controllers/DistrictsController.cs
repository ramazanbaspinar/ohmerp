using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.District;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Constants;
using OhmERP.WebApi.Security;

namespace OhmERP.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DistrictsController : BaseCrudController<DistrictDto, CreateDistrictRequest, UpdateDistrictRequest>
{
    private readonly IDistrictService _districtService;

    protected override string ReportName => "İlçe Listesi";

    public DistrictsController(IDistrictService districtService) : base(districtService)
    {
        _districtService = districtService;
    }

    [HttpGet]
    [HasPermission(Permissions.Districts.View)]
    public Task<IActionResult> GetAll([FromQuery] PaginationFilter filter) => GetAllBase(filter);

    [HttpGet("lookup/{cityId}")]
    public async Task<IActionResult> GetLookup(Guid cityId)
    {
        var districts = await _districtService.GetByCityIdAsync(cityId);
        var lookup = districts.Select(d => new { d.Id, d.Name }).OrderBy(d => d.Name);
        return Ok(lookup);
    }

    [HttpGet("city/{cityId}/lookup")]
    public async Task<IActionResult> GetByCityId(Guid cityId)
    {
        var districts = await _districtService.GetByCityIdAsync(cityId);
        return Ok(districts);
    }

    [HttpGet("{id}")]
    [HasPermission(Permissions.Districts.View)]
    public Task<IActionResult> GetById(Guid id) => GetByIdBase(id);

    [HttpPost]
    [HasPermission(Permissions.Districts.Create)]
    public Task<IActionResult> Create([FromBody] CreateDistrictRequest request) => CreateBase(request);

    [HttpPut("{id}")]
    [HasPermission(Permissions.Districts.Edit)]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateDistrictRequest request) => UpdateBase(id, request);

    [HttpDelete("{id}")]
    [HasPermission(Permissions.Districts.Delete)]
    public Task<IActionResult> Delete(Guid id) => DeleteBase(id);

    [HttpGet("export/excel")]
    public Task<IActionResult> ExportToExcel([FromQuery] PaginationFilter filter) => ExportToExcelBase(filter);

    [HttpGet("export/pdf")]
    public Task<IActionResult> ExportToPdf([FromQuery] PaginationFilter filter) => ExportToPdfBase(filter);
}