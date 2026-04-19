namespace OhmERP.Application.DTOs.User;

public class UserListDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public List<Guid> RoleIds { get; set; } = new List<Guid>();

    public bool IsActive { get; set; }
    public bool Status => IsActive;
}