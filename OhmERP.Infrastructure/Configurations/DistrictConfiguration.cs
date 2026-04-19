using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class DistrictConfiguration : IEntityTypeConfiguration<District>
{
    public void Configure(EntityTypeBuilder<District> builder)
    {
        builder.Property(x => x.Name).IsRequired().HasMaxLength(100);

        builder.HasIndex(x => x.Name);
        builder.HasIndex(x => x.CityId); // Join iþlemlerini çok hýzlandýrýr

        builder.HasOne(d => d.City)
               .WithMany(c => c.Districts)
               .HasForeignKey(d => d.CityId)
               .OnDelete(DeleteBehavior.Restrict); // Þehir silinirse ilçeler silinmesin, uyarý versin
    }
}