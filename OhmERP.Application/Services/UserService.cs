using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.User;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;
using System.Security.Cryptography;
using System.Text;

namespace OhmERP.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepo;
    private readonly IGenericRepository<User> _genericUserRepository;
    private readonly IGenericRepository<UserRole> _userRoleRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UserService(
        IUserRepository userRepo,
        IGenericRepository<User> genericUserRepository,
        IGenericRepository<UserRole> userRoleRepository,
        IUnitOfWork unitOfWork)
    {
        _userRepo = userRepo;
        _genericUserRepository = genericUserRepository;
        _userRoleRepository = userRoleRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<UserListDto>> GetAllUsersWithRolesAsync(int pageNumber, int pageSize)
    {
        return await _userRepo.GetAllUsersWithRolesAsync(pageNumber, pageSize);
    }

    public async Task CreateUserAsync(OhmERP.Application.DTOs.Auth.RegisterRequest request)
    {
        var email = request.Email.Trim().ToLower();
        var userExists = await _genericUserRepository.FindAsync(x => x.Email == email);
        if (userExists.Any())
            throw new Exception("Bu e-posta adresi zaten kullanılıyor.");

        CreatePasswordHash(request.Password, out byte[] passwordHash, out byte[] passwordSalt);

        var user = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = email,
            PasswordHash = passwordHash,
            PasswordSalt = passwordSalt,
            IsActive = true,
            IsDeleted = false
        };

        if (request.RoleIds != null && request.RoleIds.Any())
        {
            var uniqueRoleIds = request.RoleIds.Distinct().ToList();
            foreach (var roleId in uniqueRoleIds)
            {
                user.UserRoles.Add(new UserRole { RoleId = roleId });
            }
        }
        else
        {
            throw new Exception("Kullanıcıya en az bir rol atanmalıdır.");
        }

        await _genericUserRepository.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UpdateUserAsync(Guid id, OhmERP.Application.DTOs.Auth.UpdateUserRequest request)
    {
        var users = await _genericUserRepository.FindAsync(x => x.Id == id && !x.IsDeleted);
        var user = users.FirstOrDefault();
        if (user == null) throw new Exception("Güncellenecek kullanıcı bulunamadı.");

        var incomingEmail = request.Email.Trim().ToLower();
        if (user.Email != incomingEmail)
        {
            var emailCheck = await _genericUserRepository.FindAsync(x => x.Email == incomingEmail && x.Id != id);
            if (emailCheck.Any()) throw new Exception("Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.");
        }

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.Email = incomingEmail;

        if (!string.IsNullOrEmpty(request.Password))
        {
            CreatePasswordHash(request.Password, out byte[] passwordHash, out byte[] passwordSalt);
            user.PasswordHash = passwordHash;
            user.PasswordSalt = passwordSalt;
        }

        if (request.RoleIds != null)
        {
            var uniqueNewRoleIds = request.RoleIds.Distinct().ToList();
            var existingUserRoles = await _userRoleRepository.FindAsync(ur => ur.UserId == id);

            var rolesToRemove = existingUserRoles.Where(ur => !ur.IsDeleted && !uniqueNewRoleIds.Contains(ur.RoleId)).ToList();
            if (rolesToRemove.Any())
            {
                _userRoleRepository.RemoveRange(rolesToRemove);
            }

            var rolesToAdd = new List<UserRole>();

            foreach (var roleId in uniqueNewRoleIds)
            {
                var existingLink = existingUserRoles.FirstOrDefault(ur => ur.RoleId == roleId);

                if (existingLink != null)
                {
                    if (existingLink.IsDeleted)
                    {
                        existingLink.IsDeleted = false;
                        _userRoleRepository.Update(existingLink);
                    }
                }
                else
                {
                    rolesToAdd.Add(new UserRole { UserId = id, RoleId = roleId });
                }
            }

            if (rolesToAdd.Any())
            {
                await _userRoleRepository.AddRangeAsync(rolesToAdd);
            }
        }

        _genericUserRepository.Update(user);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task ToggleUserStatusAsync(Guid id)
    {
        var users = await _genericUserRepository.FindAsync(x => x.Id == id);
        var user = users.FirstOrDefault();
        if (user == null) throw new Exception("Kullanıcı bulunamadı.");

        user.IsActive = !user.IsActive;
        _genericUserRepository.Update(user);
        await _unitOfWork.SaveChangesAsync();
    }

    private void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
    {
        using (var hmac = new HMACSHA512())
        {
            passwordSalt = hmac.Key;
            passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        }
    }
}