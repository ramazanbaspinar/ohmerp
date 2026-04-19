using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class CompanyConfiguration : IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Code).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Name).IsRequired().HasMaxLength(200);
        builder.Property(c => c.ShortName).HasMaxLength(100);

        builder.Property(c => c.PrimaryContactPerson).HasMaxLength(100);
        builder.Property(c => c.Phone1).HasMaxLength(20);
        builder.Property(c => c.Phone2).HasMaxLength(20);
        builder.Property(c => c.Email).HasMaxLength(100);
        builder.Property(c => c.Website).HasMaxLength(100);

        builder.Property(c => c.Address).HasMaxLength(500);
        builder.Property(c => c.ZipCode).HasMaxLength(20);

        builder.Property(c => c.TaxOffice).HasMaxLength(100);
        builder.Property(c => c.TaxNumber).HasMaxLength(50);
        builder.Property(c => c.EInvoiceAlias).HasMaxLength(200);

        builder.Property(c => c.DefaultCurrency).HasMaxLength(3); 
        builder.Property(c => c.GLCode).HasMaxLength(50);
        builder.Property(c => c.CreditLimit).HasColumnType("decimal(18,2)");

        builder.HasIndex(c => c.Code).IsUnique().HasFilter("[IsDeleted] = 0");
        builder.HasIndex(c => c.TaxNumber); 
        builder.HasIndex(c => c.Name); 

        builder.HasOne(c => c.City)
               .WithMany()
               .HasForeignKey(c => c.CityId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.District)
               .WithMany()
               .HasForeignKey(c => c.DistrictId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}