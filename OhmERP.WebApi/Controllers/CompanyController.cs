using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.Company;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Constants;
using OhmERP.WebApi.Security;

namespace OhmERP.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CompanyController : BaseCrudController<CompanyListDto, CreateCompanyRequest, UpdateCompanyRequest>
{
    private readonly ICompanyService _companyService;

    protected override string ReportName => "Cari Hesap Listesi";

    public CompanyController(ICompanyService companyService) : base(companyService)
    {
        _companyService = companyService;
    }

    [HttpGet]
    [HasPermission(Permissions.Companies.View)]
    public Task<IActionResult> GetAll([FromQuery] PaginationFilter filter) => GetAllBase(filter);

    [HttpGet("{id}")]
    [HasPermission(Permissions.Companies.View)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _companyService.GetForUpdateAsync(id);
        return Ok(result);
    }

    [HttpPost]
    [HasPermission(Permissions.Companies.Create)]
    public Task<IActionResult> Create([FromBody] CreateCompanyRequest request) => CreateBase(request);

    [HttpPut("{id}")]
    [HasPermission(Permissions.Companies.Edit)]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateCompanyRequest request) => UpdateBase(id, request);

    [HttpDelete("{id}")]
    [HasPermission(Permissions.Companies.Delete)]
    public Task<IActionResult> Delete(Guid id) => DeleteBase(id);

    [HttpGet("export/excel")]
    public Task<IActionResult> ExportToExcel([FromQuery] PaginationFilter filter) => ExportToExcelBase(filter);

    [HttpGet("export/pdf")]
    public Task<IActionResult> ExportToPdf([FromQuery] PaginationFilter filter) => ExportToPdfBase(filter);
}