namespace OhmERP.Application.Interfaces.Services;

public interface ICurrentUserService
{
    Guid UserId { get; }
}