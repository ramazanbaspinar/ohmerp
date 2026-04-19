using Microsoft.EntityFrameworkCore;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Domain.Entities;
using OhmERP.Infrastructure.Contexts;

namespace OhmERP.Infrastructure.Repositories;

public class RolePermissionRepository : IRolePermissionRepository
{
    private readonly OhmERPDbContext _context;

    public RolePermissionRepository(OhmERPDbContext context)
    {
        _context = context;
    }

    public async Task<List<string>> GetRolePermissionsAsync(Guid roleId)
    {
        return await _context.RolePermissions
            .Where(rp => rp.RoleId == roleId)
            .Select(rp => rp.PermissionCode)
            .ToListAsync();
    }

    public async Task AssignPermissionsToRoleAsync(Guid roleId, List<string> permissionCodes)
    {
        var existingPermissions = await _context.RolePermissions
            .Where(rp => rp.RoleId == roleId)
            .ToListAsync();

        _context.RolePermissions.RemoveRange(existingPermissions);

        if (permissionCodes != null && permissionCodes.Any())
        {
            var newPermissions = permissionCodes.Select(code => new RolePermission
            {
                RoleId = roleId,
                PermissionCode = code
            }).ToList();

            await _context.RolePermissions.AddRangeAsync(newPermissions);
        }

        await _context.SaveChangesAsync();
    }
}