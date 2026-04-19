using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using OhmERP.Infrastructure.Contexts;
using System.Security.Claims;

namespace OhmERP.WebApi.Security;

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public PermissionAuthorizationHandler(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {

        if (context.User?.Identity == null || !context.User.Identity.IsAuthenticated)
        {
            return;
        }

        var userIdString = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out Guid userId))
        {
            return;
        }

        if (context.User.IsInRole("ADMIN"))
        {
            context.Succeed(requirement);
            return;
        }

        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<OhmERPDbContext>();

        var hasPermission = await dbContext.UserRoles
            .Where(ur => ur.UserId == userId)
            .Join(dbContext.RolePermissions,
                  ur => ur.RoleId,
                  rp => rp.RoleId,
                  (ur, rp) => rp)
            .AnyAsync(rp => rp.PermissionCode == requirement.Permission);

        if (hasPermission)
        {
            context.Succeed(requirement);
        }
    }
}