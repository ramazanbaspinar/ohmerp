namespace OhmERP.Application.DTOs.Auth;

public class UpdateUserRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Password { get; set; }
    public List<Guid> RoleIds { get; set; } = new List<Guid>();
}