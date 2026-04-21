using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class BOMConfiguration : IEntityTypeConfiguration<BOM>
{
    public void Configure(EntityTypeBuilder<BOM> builder)
    {
        builder.HasKey(x => x.Id);
        
        builder.Property(x => x.Code).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(150);

        builder.HasIndex(x => x.Code).IsUnique();

        builder.HasOne(x => x.Item)
            .WithMany()
            .HasForeignKey(x => x.ItemId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.BOMLines)
            .WithOne(x => x.BOM)
            .HasForeignKey(x => x.BOMId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.BOMOperations)
            .WithOne(x => x.BOM)
            .HasForeignKey(x => x.BOMId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
