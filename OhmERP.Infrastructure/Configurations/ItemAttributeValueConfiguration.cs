using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class ItemAttributeValueConfiguration : IEntityTypeConfiguration<ItemAttributeValue>
{
    public void Configure(EntityTypeBuilder<ItemAttributeValue> builder)
    {
        builder.Property(x => x.StringValue).HasMaxLength(500);
        builder.Property(x => x.DecimalValue).HasPrecision(18, 4);

        builder.HasOne(x => x.Item)
               .WithMany(i => i.AttributeValues)
               .HasForeignKey(x => x.ItemId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.CategoryAttribute)
               .WithMany(ca => ca.AttributeValues)
               .HasForeignKey(x => x.CategoryAttributeId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
