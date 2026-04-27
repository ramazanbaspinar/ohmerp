using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class ProductInnerDetailConfiguration : IEntityTypeConfiguration<ProductInnerDetail>
{
    public void Configure(EntityTypeBuilder<ProductInnerDetail> builder)
    {
        builder.HasKey(pid => pid.Id);

        builder.HasOne(pid => pid.Product)
            .WithOne(p => p.InnerDetail)
            .HasForeignKey<ProductInnerDetail>(pid => pid.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pid => pid.InnerVoltParameter).WithMany().HasForeignKey(pid => pid.InnerVoltParameterId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(pid => pid.InnerWattParameter).WithMany().HasForeignKey(pid => pid.InnerWattParameterId).OnDelete(DeleteBehavior.Restrict);
        
        builder.Property(pid => pid.InnerOhmValue).HasColumnType("decimal(18,2)");
        builder.Property(pid => pid.InnerPipeLength).HasColumnType("decimal(18,2)");
        builder.Property(pid => pid.InnerRolledLength).HasColumnType("decimal(18,2)");
        builder.Property(pid => pid.InnerMixedSand1Ratio).HasColumnType("decimal(18,2)");
        builder.Property(pid => pid.InnerMixedSand2Ratio).HasColumnType("decimal(18,2)");

        builder.HasOne(pid => pid.InnerWire).WithMany().HasForeignKey(pid => pid.InnerWireId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(pid => pid.InnerSheet).WithMany().HasForeignKey(pid => pid.InnerSheetId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(pid => pid.InnerGas).WithMany().HasForeignKey(pid => pid.InnerGasId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(pid => pid.InnerPin).WithMany().HasForeignKey(pid => pid.InnerPinId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(pid => pid.InnerPlug1).WithMany().HasForeignKey(pid => pid.InnerPlug1Id).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(pid => pid.InnerPlug2).WithMany().HasForeignKey(pid => pid.InnerPlug2Id).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(pid => pid.InnerSocket1).WithMany().HasForeignKey(pid => pid.InnerSocket1Id).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(pid => pid.InnerSocket2).WithMany().HasForeignKey(pid => pid.InnerSocket2Id).OnDelete(DeleteBehavior.Restrict);
        
        builder.HasOne(pid => pid.InnerSand).WithMany().HasForeignKey(pid => pid.InnerSandId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(pid => pid.InnerMixedSand1).WithMany().HasForeignKey(pid => pid.InnerMixedSand1Id).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(pid => pid.InnerMixedSand2).WithMany().HasForeignKey(pid => pid.InnerMixedSand2Id).OnDelete(DeleteBehavior.Restrict);
    }
}
