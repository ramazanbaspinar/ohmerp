using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.WorkCenter;
using OhmERP.Application.Interfaces.Services;

namespace OhmERP.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkCentersController : BaseCrudController<WorkCenterListDto, CreateWorkCenterRequest, UpdateWorkCenterRequest>
{
    protected override string ReportName => "İş Merkezleri Listesi";

    public WorkCentersController(IWorkCenterService workCenterService) : base(workCenterService)
    {
    }

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] PaginationFilter filter) => GetAllBase(filter);

    [HttpGet("{id}")]
    public Task<IActionResult> GetById(Guid id) => GetByIdBase(id);

    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateWorkCenterRequest request) => CreateBase(request);

    [HttpPut("{id}")]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateWorkCenterRequest request) => UpdateBase(id, request);

    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(Guid id) => DeleteBase(id);
}
