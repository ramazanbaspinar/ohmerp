using FluentValidation;
using FluentValidation.AspNetCore;
using Hangfire;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Application.Mappings;
using OhmERP.Application.Services;
using OhmERP.Infrastructure;
using OhmERP.Infrastructure.Repositories;
using OhmERP.WebApi.Middlewares;
using OhmERP.WebApi.Security;
using OhmERP.WebApi.Services;
using Scalar.AspNetCore;
using System.Text;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(e => e.Value != null && e.Value.Errors.Count > 0)
                .SelectMany(x => x.Value!.Errors)
                .Select(x => "Gönderilen veri formatı hatalı veya geçersiz.")
                .FirstOrDefault();

            return new BadRequestObjectResult(new { message = errors });
        };
    });

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Secret"];

if (string.IsNullOrEmpty(secretKey))
    throw new InvalidOperationException("JWT Secret appsettings.json dosyasında bulunamadı!");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRolePermissionRepository, RolePermissionRepository>();

builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICityService, CityService>();
builder.Services.AddScoped<IDistrictService, DistrictService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<ICompanyService, CompanyService>();
builder.Services.AddScoped<IUnitOfMeasureService, UnitOfMeasureService>();
builder.Services.AddScoped<IItemCategoryService, ItemCategoryService>();
builder.Services.AddScoped<IItemService, ItemService>();
builder.Services.AddScoped<IWorkCenterService, WorkCenterService>();
builder.Services.AddScoped<IBOMService, BOMService>();
builder.Services.AddScoped<ICostEngineService, CostEngineService>();
builder.Services.AddScoped<ICurrencyService, CurrencyService>();

builder.Services.AddInfrastructureServices(builder.Configuration);

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<OhmERP.Application.Validators.City.CreateCityValidator>();

builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddProfile<GeneralMappingProfile>();
    cfg.AddProfile<WorkCenterProfile>();
    cfg.AddProfile<OhmERP.Application.Profiles.BOMProfile>();
});

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<OhmERP.Infrastructure.Contexts.OhmERPDbContext>();
    await context.Database.MigrateAsync();

    var kgUnit = await context.UnitOfMeasures.FirstOrDefaultAsync(x => x.Code == "KG");
    if (kgUnit == null)
    {
        kgUnit = new OhmERP.Domain.Entities.UnitOfMeasure 
        { 
            Code = "KG", 
            Name = "Kilogram", 
            IsActive = true, 
            CreatedDate = DateTime.UtcNow, 
            CreatedBy = Guid.Empty 
        };
        context.UnitOfMeasures.Add(kgUnit);
        await context.SaveChangesAsync();
    }

    var telCategory = await context.ItemCategories.FirstOrDefaultAsync(x => x.Code == "TEL");
    if (telCategory == null)
    {
        telCategory = new OhmERP.Domain.Entities.ItemCategory 
        { 
            Code = "TEL", 
            Name = "Tel Tanımları", 
            DefaultUnitOfMeasureId = kgUnit.Id, 
            ShowInMenu = false, 
            IsActive = true, 
            CreatedDate = DateTime.UtcNow, 
            CreatedBy = Guid.Empty 
        };
        context.ItemCategories.Add(telCategory);
        await context.SaveChangesAsync();
    }

    var sacCategory = await context.ItemCategories.FirstOrDefaultAsync(x => x.Code == "SAC");
    if (sacCategory == null)
    {
        sacCategory = new OhmERP.Domain.Entities.ItemCategory 
        { 
            Code = "SAC", 
            Name = "Sac Tanımları", 
            DefaultUnitOfMeasureId = kgUnit.Id, 
            ShowInMenu = false, 
            IsActive = true, 
            CreatedDate = DateTime.UtcNow, 
            CreatedBy = Guid.Empty 
        };
        context.ItemCategories.Add(sacCategory);
        await context.SaveChangesAsync();
    }
}

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    DashboardTitle = "OhmERP Arka Plan Görev Yöneticisi"
});

using (var scope = app.Services.CreateScope())
{
    var recurringJobManager = scope.ServiceProvider.GetRequiredService<Hangfire.IRecurringJobManager>();
    recurringJobManager.AddOrUpdate<OhmERP.Application.Interfaces.Services.ICurrencyService>(
        "ExchangeRateSync",
        service => service.SyncDailyRatesAsync(),
        "31 15 * * 1-5",
        new Hangfire.RecurringJobOptions
        {
            TimeZone = TimeZoneInfo.FindSystemTimeZoneById("Turkey Standard Time")
        });
}

app.Run();

