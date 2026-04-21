using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class ItemConfiguration : IEntityTypeConfiguration<Item>
{
    public void Configure(EntityTypeBuilder<Item> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Code).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Barcode).HasMaxLength(50);
        builder.Property(x => x.TaxRate).HasColumnType("decimal(18,2)");
        builder.Property(x => x.CriticalStockLevel).HasColumnType("decimal(18,2)");
        builder.Property(x => x.Description).HasMaxLength(500);

        builder.Property(x => x.UnitCost).HasColumnType("decimal(18,4)");

        builder.Property(x => x.PropertiesJson).HasColumnType("nvarchar(max)");

        builder.HasIndex(x => x.Code).IsUnique().HasFilter("[IsDeleted] = 0");

        builder.HasOne(x => x.Category)
               .WithMany(x => x.Items)
               .HasForeignKey(x => x.CategoryId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.UnitOfMeasure)
               .WithMany()
               .HasForeignKey(x => x.UnitOfMeasureId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}