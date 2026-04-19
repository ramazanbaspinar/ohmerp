using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class CompanyContactConfiguration : IEntityTypeConfiguration<CompanyContact>
{
    public void Configure(EntityTypeBuilder<CompanyContact> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.FirstName).IsRequired().HasMaxLength(50);
        builder.Property(c => c.LastName).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Title).HasMaxLength(100);
        builder.Property(c => c.Department).HasMaxLength(100);
        builder.Property(c => c.Phone1).HasMaxLength(20);
        builder.Property(c => c.Phone2).HasMaxLength(20);
        builder.Property(c => c.Email).HasMaxLength(100);

        builder.HasOne(c => c.Company)
               .WithMany(comp => comp.Contacts)
               .HasForeignKey(c => c.CompanyId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}