using Hangfire;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Application.Services;
using OhmERP.Infrastructure.Contexts;
using OhmERP.Infrastructure.Repositories;
using OhmERP.Infrastructure.Services;
using StackExchange.Redis;

namespace OhmERP.Infrastructure;

public static class ServiceRegistration
{
    public static void AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<OhmERPDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        var redisConnectionString = configuration.GetConnectionString("Redis");
        services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(redisConnectionString!));

        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnectionString;
        });

        services.AddScoped<ICacheService, RedisCacheService>();
        services.AddScoped<INumeratorService, NumeratorService>();
        services.AddScoped<ICodeTemplateService, CodeTemplateService>();

        services.AddHangfire(config => config
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UseSqlServerStorage(configuration.GetConnectionString("DefaultConnection")));

        services.AddHangfireServer();
    }
}