using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class BOMLineConfiguration : IEntityTypeConfiguration<BOMLine>
{
    public void Configure(EntityTypeBuilder<BOMLine> builder)
    {
        builder.HasKey(x => x.Id);
        
        builder.Property(x => x.Quantity).HasPrecision(18, 4);
        builder.Property(x => x.ScrapRate).HasPrecision(18, 4);

        builder.HasOne(x => x.BOM)
            .WithMany(x => x.BOMLines)
            .HasForeignKey(x => x.BOMId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Material)
            .WithMany()
            .HasForeignKey(x => x.MaterialId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.UnitOfMeasure)
            .WithMany()
            .HasForeignKey(x => x.UnitOfMeasureId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
