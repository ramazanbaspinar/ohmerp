using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class CityConfiguration : IEntityTypeConfiguration<City>
{
    public void Configure(EntityTypeBuilder<City> builder)
    {
        builder.Property(x => x.Name).IsRequired().HasMaxLength(100);
        builder.Property(x => x.PlateCode).IsRequired().HasMaxLength(10);

        builder.HasIndex(x => x.Name).IsUnique();
        builder.HasIndex(x => x.PlateCode).IsUnique();
        builder.HasIndex(x => x.IsDeleted); // Soft delete filtresi için hýzlandýrýcý
    }
}