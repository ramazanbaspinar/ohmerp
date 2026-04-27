using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class ProductOperationConfiguration : IEntityTypeConfiguration<ProductOperation>
{
    public void Configure(EntityTypeBuilder<ProductOperation> builder)
    {
        builder.HasKey(po => po.Id);

        builder.HasOne(po => po.Product)
            .WithMany(p => p.Operations)
            .HasForeignKey(po => po.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(po => po.WorkCenter)
            .WithMany()
            .HasForeignKey(po => po.WorkCenterId)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.Property(po => po.OperationTimeMinutes).HasColumnType("decimal(18,2)");
    }
}
