using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.Auth;
using OhmERP.Application.Interfaces.Services;

namespace OhmERP.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("setup-root-admin")]
    [AllowAnonymous]
    public async Task<IActionResult> SetupRootAdmin()
    {
        try
        {
            var result = await _authService.SetupRootAdminAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        try
        {
            var result = await _authService.LoginAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}