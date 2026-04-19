namespace OhmERP.Application.Interfaces.Services;

public interface IRoleService
{
    Task<List<string>> GetRolePermissionsAsync(Guid roleId);
    Task AssignPermissionsToRoleAsync(Guid roleId, List<string> permissionCodes);
    Task<object> GetRolesAsync(int page, int pageSize, string? search, bool? isActive);
    Task<object> GetRoleLookupAsync();
    Task CreateRoleAsync(OhmERP.Application.DTOs.Role.RoleDto request);
    Task UpdateRoleAsync(Guid id, OhmERP.Application.DTOs.Role.RoleDto request);
    Task ToggleRoleStatusAsync(Guid id);
    Task DeleteRoleAsync(Guid id, string? userIdString);
    Task<List<OhmERP.Domain.Entities.Role>> GetAllRolesForExportAsync(string? search, bool? isActive);
}