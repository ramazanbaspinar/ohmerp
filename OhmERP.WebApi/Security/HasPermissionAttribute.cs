using Microsoft.AspNetCore.Authorization;

namespace OhmERP.WebApi.Security;

public class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(string permission) : base(policy: permission)
    {
    }
}