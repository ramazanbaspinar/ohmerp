using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.User;

namespace OhmERP.Application.Interfaces.Repositories;

public interface IUserRepository
{
    Task<PagedResult<UserListDto>> GetAllUsersWithRolesAsync(int pageNumber, int pageSize);
}