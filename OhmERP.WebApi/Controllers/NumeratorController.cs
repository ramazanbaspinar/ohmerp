using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Enums;
using System.Threading.Tasks;

namespace OhmERP.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NumeratorController : ControllerBase
{
    private readonly INumeratorService _numeratorService;

    public NumeratorController(INumeratorService numeratorService)
    {
        _numeratorService = numeratorService;
    }

    [HttpGet("PreviewNextCode/{documentType}")]
    public async Task<IActionResult> PreviewNextCode(int documentType)
    {
        if (!System.Enum.IsDefined(typeof(DocumentType), documentType))
        {
            return BadRequest(new { message = "Geçersiz belge tipi." });
        }

        var type = (DocumentType)documentType;
        var info = await _numeratorService.PreviewNextCodeAsync(type);

        return Ok(new
        {
            nextCode = info.NextCode,
            isManualEntryAllowed = info.IsManualEntryAllowed
        });
    }
}
