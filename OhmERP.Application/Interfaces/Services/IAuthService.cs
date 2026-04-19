namespace OhmERP.Application.Interfaces.Services;

public interface IAuthService
{
    Task<object> SetupRootAdminAsync();
    Task<object> LoginAsync(OhmERP.Application.DTOs.Auth.LoginRequest request);
}
