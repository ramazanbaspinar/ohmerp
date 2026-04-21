using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class BOMOperationConfiguration : IEntityTypeConfiguration<BOMOperation>
{
    public void Configure(EntityTypeBuilder<BOMOperation> builder)
    {
        builder.HasKey(x => x.Id);
        
        builder.Property(x => x.SetupTime).HasPrecision(18, 4);
        builder.Property(x => x.RunTime).HasPrecision(18, 4);

        builder.HasOne(x => x.BOM)
            .WithMany(x => x.BOMOperations)
            .HasForeignKey(x => x.BOMId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.WorkCenter)
            .WithMany()
            .HasForeignKey(x => x.WorkCenterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
