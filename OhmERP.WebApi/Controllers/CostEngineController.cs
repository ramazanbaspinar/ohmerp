using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.CostEngine;
using OhmERP.Application.Interfaces.Services;

namespace OhmERP.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CostEngineController : ControllerBase
{
    private readonly ICostEngineService _costEngineService;

    public CostEngineController(ICostEngineService costEngineService)
    {
        _costEngineService = costEngineService;
    }

    [HttpPost("calculate")]
    public async Task<IActionResult> CalculateCost([FromBody] CostCalculationRequest request)
    {
        var result = await _costEngineService.CalculateCostAsync(request);
        return Ok(result);
    }
}
