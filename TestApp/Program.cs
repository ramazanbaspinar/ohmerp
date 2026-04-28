using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OhmERP.Domain.Entities;
using OhmERP.Infrastructure.Contexts;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Infrastructure.Repositories;

namespace TestApp
{
    class CurrentUserServiceMock : ICurrentUserService
    {
        public Guid UserId => Guid.Parse("d865c2e3-aa4c-4f46-9187-012112b96475");
        public string Email => "admin@test.com";
        public string FullName => "Admin";
    }

    class Program
    {
        static async System.Threading.Tasks.Task Main(string[] args)
        {
            var services = new ServiceCollection();
            
            // We need to read the connection string. Let's hardcode it or read it from appsettings.
            // Since I am in the user's environment, I can read the WebApi appsettings.json.
            var connStr = "Server=localhost;Database=OhmERPDb;User Id=sa;Password=123;TrustServerCertificate=True;MultipleActiveResultSets=true;";

            services.AddDbContext<OhmERPDbContext>(options =>
                options.UseSqlServer(connStr));

            services.AddScoped<ICurrentUserService, CurrentUserServiceMock>();
            
            var provider = services.BuildServiceProvider();
            var context = provider.GetRequiredService<OhmERPDbContext>();

            try
            {
                var product = await context.Products
                    .Include(p => p.Images)
                    .Include(p => p.Operations)
                    .Include(p => p.InnerDetail)
                    .FirstOrDefaultAsync();

                if (product != null)
                {
                    Console.WriteLine($"Found product: {product.Id}");
                    
                    product.Images.Clear();
                    product.Images.Add(new ProductImage { Id = Guid.Empty, ImageBase64 = "testbase64", SequenceOrder = 1 });

                    // See what happens on SaveChanges
                    try 
                    {
                        await context.SaveChangesAsync();
                        Console.WriteLine("Saved successfully!");
                    }
                    catch (DbUpdateConcurrencyException ex)
                    {
                        var entry = ex.Entries.FirstOrDefault();
                        Console.WriteLine($"Concurrency Exception on: {entry?.Entity?.GetType().Name}, State: {entry?.State}");
                        
                        // Let's print the actual values trying to be updated
                        if (entry != null)
                        {
                            foreach (var prop in entry.Properties)
                            {
                                Console.WriteLine($"{prop.Metadata.Name}: Original='{prop.OriginalValue}', Current='{prop.CurrentValue}', IsModified={prop.IsModified}");
                            }
                        }
                    }
                }
                else
                {
                    Console.WriteLine("No product found to test with.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("General error: " + ex.ToString());
            }
        }
    }
}
