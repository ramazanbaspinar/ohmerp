namespace OhmERP.Application.Interfaces.Repositories;

public interface IRolePermissionRepository
{
    Task<List<string>> GetRolePermissionsAsync(Guid roleId);
    Task AssignPermissionsToRoleAsync(Guid roleId, List<string> permissionCodes);
}