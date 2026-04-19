using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.City;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Constants;
using OhmERP.WebApi.Security;

namespace OhmERP.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CitiesController : BaseCrudController<CityDto, CreateCityRequest, UpdateCityRequest>
{
    private readonly ICityService _cityService;

    protected override string ReportName => "İl Listesi";

    public CitiesController(ICityService cityService) : base(cityService)
    {
        _cityService = cityService;
    }

    [HttpGet]
    [HasPermission(Permissions.Cities.View)]
    public Task<IActionResult> GetAll([FromQuery] PaginationFilter filter) => GetAllBase(filter);

    [HttpGet("lookup")]
    public async Task<IActionResult> GetLookup()
    {
        var cities = await _cityService.GetAllAsync();
        var lookup = cities.Select(c => new { c.Id, c.Name }).OrderBy(c => c.Name);
        return Ok(lookup);
    }

    [HttpGet("{id}")]
    [HasPermission(Permissions.Cities.View)]
    public Task<IActionResult> GetById(Guid id) => GetByIdBase(id);

    [HttpPost]
    [HasPermission(Permissions.Cities.Create)]
    public Task<IActionResult> Create([FromBody] CreateCityRequest request) => CreateBase(request);

    [HttpPut("{id}")]
    [HasPermission(Permissions.Cities.Edit)]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateCityRequest request) => UpdateBase(id, request);

    [HttpDelete("{id}")]
    [HasPermission(Permissions.Cities.Delete)]
    public Task<IActionResult> Delete(Guid id) => DeleteBase(id);

    [HttpGet("export/excel")]
    public Task<IActionResult> ExportToExcel([FromQuery] PaginationFilter filter) => ExportToExcelBase(filter);

    [HttpGet("export/pdf")]
    public Task<IActionResult> ExportToPdf([FromQuery] PaginationFilter filter) => ExportToPdfBase(filter);
}