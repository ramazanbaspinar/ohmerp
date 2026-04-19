using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.User;

namespace OhmERP.Application.Interfaces.Services;

public interface IUserService
{
    Task<PagedResult<UserListDto>> GetAllUsersWithRolesAsync(int pageNumber, int pageSize);
    Task CreateUserAsync(OhmERP.Application.DTOs.Auth.RegisterRequest request);
    Task UpdateUserAsync(Guid id, OhmERP.Application.DTOs.Auth.UpdateUserRequest request);
    Task ToggleUserStatusAsync(Guid id);
}