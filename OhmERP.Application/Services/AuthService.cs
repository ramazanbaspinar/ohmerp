using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OhmERP.Application.DTOs.Auth;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace OhmERP.Application.Services;

public class AuthService : IAuthService
{
    private readonly IGenericRepository<User> _userRepository;
    private readonly IGenericRepository<Role> _roleRepository;
    private readonly IGenericRepository<UserRole> _userRoleRepository;
    private readonly IRolePermissionRepository _rolePermissionRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;

    public AuthService(
        IGenericRepository<User> userRepository,
        IGenericRepository<Role> roleRepository,
        IGenericRepository<UserRole> userRoleRepository,
        IRolePermissionRepository rolePermissionRepository,
        IUnitOfWork unitOfWork,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _userRoleRepository = userRoleRepository;
        _rolePermissionRepository = rolePermissionRepository;
        _unitOfWork = unitOfWork;
        _configuration = configuration;
    }

    public async Task<object> SetupRootAdminAsync()
    {
        var existingUsers = await _userRepository.FindAsync(x => x.IsDeleted == false);
        if (existingUsers.Any())
        {
            throw new Exception("Sistem zaten kurulmuş! Bu işlem sadece tamamen boş bir veritabanında çalışır.");
        }

        var adminRoles = await _roleRepository.FindAsync(x => x.Code == "ADMIN" && x.IsDeleted == false);
        var rootRole = adminRoles.FirstOrDefault();

        if (rootRole == null)
        {
            throw new Exception("Kritik Hata: ADMIN rolü bulunamadı. Lütfen Veritabanı Seed işleminizi kontrol edin.");
        }

        CreatePasswordHash("ohmerp", out byte[] passwordHash, out byte[] passwordSalt);

        var rootUser = new User
        {
            FirstName = "Sistem",
            LastName = "Yöneticisi",
            Email = "admin@ohmerp.com",
            PasswordHash = passwordHash,
            PasswordSalt = passwordSalt,
            IsActive = true
        };

        rootUser.UserRoles.Add(new UserRole { RoleId = rootRole.Id });

        await _userRepository.AddAsync(rootUser);
        await _unitOfWork.SaveChangesAsync();

        return new
        {
            message = "ERP Sistemi Başarıyla Kuruldu!",
            email = "admin@ohmerp.com",
            password = "ohmerp"
        };
    }

    public async Task<object> LoginAsync(LoginRequest request)
    {
        var users = await _userRepository.FindAsync(x => x.Email == request.Email);
        var user = users.FirstOrDefault();

        if (user == null || !VerifyPasswordHash(request.Password, user.PasswordHash, user.PasswordSalt))
            throw new Exception("Kullanıcı bulunamadı veya şifre hatalı.");

        if (!user.IsActive)
            throw new Exception("Hesabınız pasife alınmış. Lütfen yönetici ile iletişime geçin.");

        var userRoles = await _userRoleRepository.FindAsync(ur => ur.UserId == user.Id && !ur.IsDeleted);
        var activeRoleCodes = new List<string>();
        var uniquePermissions = new HashSet<string>();

        foreach (var ur in userRoles)
        {
            var roles = await _roleRepository.FindAsync(r => r.Id == ur.RoleId && r.IsActive && !r.IsDeleted);
            var role = roles.FirstOrDefault();

            if (role != null)
            {
                activeRoleCodes.Add(role.Code);

                var permissions = await _rolePermissionRepository.GetRolePermissionsAsync(role.Id);
                foreach (var perm in permissions)
                {
                    uniquePermissions.Add(perm);
                }
            }
        }

        string token = CreateToken(user, activeRoleCodes, uniquePermissions.ToList());

        return new
        {
            message = "Giriş başarılı.",
            token = token,
            user = new
            {
                id = user.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                email = user.Email,
                roles = activeRoleCodes
            }
        };
    }

    private bool VerifyPasswordHash(string password, byte[] passwordHash, byte[] passwordSalt)
    {
        using (var hmac = new HMACSHA512(passwordSalt))
        {
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            return computedHash.SequenceEqual(passwordHash);
        }
    }

    private string CreateToken(User user, List<string> roles, List<string> permissions)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}")
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        foreach (var permission in permissions)
        {
            claims.Add(new Claim("Permission", permission));
        }

        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["Secret"];

        if (string.IsNullOrEmpty(secretKey))
            throw new InvalidOperationException("JWT Secret appsettings.json dosyasında bulunamadı!");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiryMinutes = Convert.ToDouble(jwtSettings["ExpiryMinutes"]);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
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
