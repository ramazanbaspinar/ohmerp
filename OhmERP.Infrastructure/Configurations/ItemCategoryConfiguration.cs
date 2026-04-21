using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class ItemCategoryConfiguration : IEntityTypeConfiguration<ItemCategory>
{
    public void Configure(EntityTypeBuilder<ItemCategory> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Code).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Description).HasMaxLength(500);

        builder.HasIndex(x => x.Code).IsUnique().HasFilter("[IsDeleted] = 0");

        builder.HasOne(x => x.Parent)
               .WithMany(x => x.SubCategories)
               .HasForeignKey(x => x.ParentId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.DefaultUnitOfMeasure)
               .WithMany()
               .HasForeignKey(x => x.DefaultUnitOfMeasureId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}