using Microsoft.EntityFrameworkCore;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.User;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Infrastructure.Contexts;

namespace OhmERP.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly OhmERPDbContext _context;

    public UserRepository(OhmERPDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<UserListDto>> GetAllUsersWithRolesAsync(int pageNumber, int pageSize)
    {
        var query = _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Where(u => !u.IsDeleted);

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderByDescending(u => u.CreatedDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserListDto
            {
                Id = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Email = u.Email,
                IsActive = u.IsActive,
                Role = string.Join(", ", u.UserRoles
                    .Where(ur => !ur.IsDeleted && ur.Role != null && !ur.Role.IsDeleted)
                    .Select(ur => ur.Role!.Name)),
                RoleIds = u.UserRoles
                    .Where(ur => !ur.IsDeleted && ur.Role != null && !ur.Role.IsDeleted)
                    .Select(ur => ur.RoleId).ToList()
            })
            .ToListAsync();

        return new PagedResult<UserListDto>
        {
            Items = users,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }
}