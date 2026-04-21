using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class CategoryAttributeConfiguration : IEntityTypeConfiguration<CategoryAttribute>
{
    public void Configure(EntityTypeBuilder<CategoryAttribute> builder)
    {
        builder.Property(x => x.Name).HasMaxLength(100).IsRequired();
        builder.Property(x => x.DataType).HasMaxLength(50).IsRequired();

        builder.HasOne(x => x.ItemCategory)
               .WithMany(c => c.CategoryAttributes)
               .HasForeignKey(x => x.ItemCategoryId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
