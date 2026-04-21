using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.Interfaces.Services;

namespace OhmERP.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CurrencyRatesController : ControllerBase
{
    private readonly ICurrencyService _currencyService;

    public CurrencyRatesController(ICurrencyService currencyService)
    {
        _currencyService = currencyService;
    }

    [HttpGet("today")]
    public async Task<IActionResult> GetTodayRates()
    {
        var rates = await _currencyService.GetTodayRatesAsync();
        return Ok(rates);
    }
}
