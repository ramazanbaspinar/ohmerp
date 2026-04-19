using OhmERP.Application.DTOs.Role;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;

namespace OhmERP.Application.Services;

public class RoleService : IRoleService
{
    private readonly IRolePermissionRepository _rolePermissionRepository;
    private readonly ICacheService _cacheService;
    private readonly IGenericRepository<Role> _roleRepository;
    private readonly IGenericRepository<UserRole> _userRoleRepository;
    private readonly IUnitOfWork _unitOfWork;

    public RoleService(
        IRolePermissionRepository rolePermissionRepository, 
        ICacheService cacheService,
        IGenericRepository<Role> roleRepository,
        IGenericRepository<UserRole> userRoleRepository,
        IUnitOfWork unitOfWork)
    {
        _rolePermissionRepository = rolePermissionRepository;
        _cacheService = cacheService;
        _roleRepository = roleRepository;
        _userRoleRepository = userRoleRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<List<string>> GetRolePermissionsAsync(Guid roleId)
    {
        return await _rolePermissionRepository.GetRolePermissionsAsync(roleId);
    }

    public async Task AssignPermissionsToRoleAsync(Guid roleId, List<string> permissionCodes)
    {
        await _rolePermissionRepository.AssignPermissionsToRoleAsync(roleId, permissionCodes);
        await _cacheService.RemoveByPrefixAsync("permissions_");
    }

    public async Task<object> GetRolesAsync(int page, int pageSize, string? search, bool? isActive)
    {
        var roles = await _roleRepository.FindAsync(x => !x.IsDeleted);

        if (!string.IsNullOrEmpty(search))
        {
            roles = roles.Where(r => r.Name.Contains(search) || r.Code.Contains(search));
        }

        if (isActive.HasValue)
        {
            roles = roles.Where(r => r.IsActive == isActive.Value);
        }

        var totalCount = roles.Count();
        var pagedRoles = roles.OrderByDescending(r => r.CreatedDate)
                              .Skip((page - 1) * pageSize)
                              .Take(pageSize)
                              .Select(r => new
                              {
                                  id = r.Id,
                                  code = r.Code,
                                  name = r.Name,
                                  description = r.Description,
                                  isActive = r.IsActive
                              });

        return new { items = pagedRoles, totalCount = totalCount };
    }

    public async Task<object> GetRoleLookupAsync()
    {
        var roles = await _roleRepository.FindAsync(x => x.IsActive && !x.IsDeleted);
        return roles.Select(r => new { id = r.Id, name = r.Name }).ToList();
    }

    public async Task CreateRoleAsync(RoleDto request)
    {
        string safeCode = request.Code.Trim();
        var existingRoles = await _roleRepository.FindAsync(x => x.Code == safeCode);
        var existingRole = existingRoles.FirstOrDefault();

        if (existingRole != null)
        {
            if (existingRole.IsDeleted)
            {
                existingRole.IsDeleted = false;
                existingRole.DeletedBy = null;
                existingRole.DeletedDate = null;
                existingRole.IsActive = true;
                existingRole.Name = request.Name.Trim();
                existingRole.Description = request.Description?.Trim() ?? string.Empty;

                _roleRepository.Update(existingRole);
                await _unitOfWork.SaveChangesAsync();
                return;
            }
            throw new Exception("Bu Rol Kodu zaten kullanımda. Lütfen farklı bir kod giriniz.");
        }

        var newRole = new Role
        {
            Code = safeCode,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            IsActive = true,
            IsDeleted = false
        };

        await _roleRepository.AddAsync(newRole);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UpdateRoleAsync(Guid id, RoleDto request)
    {
        var roles = await _roleRepository.FindAsync(x => x.Id == id && !x.IsDeleted);
        var roleToUpdate = roles.FirstOrDefault();

        if (roleToUpdate == null) throw new Exception("Güncellenmek istenen rol sistemde bulunamadı.");
        if (roleToUpdate.Code == "ADMIN") throw new Exception("Sistemin kök Admin rolü güncellenemez.");

        string safeCode = request.Code.Trim();
        if (roleToUpdate.Code != safeCode)
        {
            var conflict = await _roleRepository.FindAsync(x => x.Code == safeCode && x.Id != id);
            if (conflict.Any(x => !x.IsDeleted)) throw new Exception("Bu Rol Kodu zaten kullanımda. Lütfen farklı bir kod giriniz.");
            roleToUpdate.Code = safeCode;
        }

        roleToUpdate.Name = request.Name.Trim();
        roleToUpdate.Description = request.Description?.Trim() ?? string.Empty;

        _roleRepository.Update(roleToUpdate);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task ToggleRoleStatusAsync(Guid id)
    {
        var roles = await _roleRepository.FindAsync(x => x.Id == id && !x.IsDeleted);
        var role = roles.FirstOrDefault();

        if (role == null) throw new Exception("İşlem yapılacak rol sistemde bulunamadı.");
        if (role.Code == "ADMIN") throw new Exception("Sistemin kök Admin rolü pasife alınamaz.");

        role.IsActive = !role.IsActive;

        _roleRepository.Update(role);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteRoleAsync(Guid id, string? userIdString)
    {
        var roles = await _roleRepository.FindAsync(x => x.Id == id && !x.IsDeleted);
        var role = roles.FirstOrDefault();

        if (role == null) throw new Exception("Silinmek istenen rol sistemde bulunamadı.");
        if (role.Code == "ADMIN") throw new Exception("Sistemin kök Admin rolü silinemez.");

        var inUseCheck = await _userRoleRepository.FindAsync(x => x.RoleId == id);
        if (inUseCheck.Any())
            throw new Exception("Bu role atanmış kullanıcılar var. Önce kullanıcıların rolünü değiştirin.");

        role.IsDeleted = true;
        role.IsActive = false;
        role.DeletedDate = DateTime.UtcNow;

        if (Guid.TryParse(userIdString, out Guid userId))
        {
            role.DeletedBy = userId;
        }

        _roleRepository.Update(role);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<List<Role>> GetAllRolesForExportAsync(string? search, bool? isActive)
    {
        var roles = await _roleRepository.FindAsync(x => !x.IsDeleted);
        if (!string.IsNullOrEmpty(search))
            roles = roles.Where(r => r.Name.Contains(search) || r.Code.Contains(search));
        if (isActive.HasValue)
            roles = roles.Where(r => r.IsActive == isActive.Value);

        return roles.OrderByDescending(r => r.CreatedDate).ToList();
    }
}