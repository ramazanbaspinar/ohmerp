namespace OhmERP.Application.DTOs.Auth;

public class RegisterRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public List<Guid> RoleIds { get; set; } = new List<Guid>(); // YENİ: Çoğul Rol Listesi
}