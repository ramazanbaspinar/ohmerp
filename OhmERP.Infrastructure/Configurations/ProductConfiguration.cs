using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Code).IsRequired().HasMaxLength(50);
        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);

        builder.HasOne(p => p.Firm).WithMany().HasForeignKey(p => p.FirmId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.VoltParameter).WithMany().HasForeignKey(p => p.VoltParameterId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.WattParameter).WithMany().HasForeignKey(p => p.WattParameterId).OnDelete(DeleteBehavior.Restrict);
        
        builder.Property(p => p.OhmValue).HasColumnType("decimal(18,2)");
        builder.Property(p => p.PipeLength).HasColumnType("decimal(18,2)");
        builder.Property(p => p.RolledLength).HasColumnType("decimal(18,2)");
        builder.Property(p => p.ConnectionWireLength).HasColumnType("decimal(18,2)");
        builder.Property(p => p.MixedSand1Ratio).HasColumnType("decimal(18,2)");
        builder.Property(p => p.MixedSand2Ratio).HasColumnType("decimal(18,2)");
        
        builder.Property(p => p.Plug1Qty).HasDefaultValue(2);

        builder.HasOne(p => p.Wire).WithMany().HasForeignKey(p => p.WireId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.Sheet).WithMany().HasForeignKey(p => p.SheetId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.Gas).WithMany().HasForeignKey(p => p.GasId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.Pin).WithMany().HasForeignKey(p => p.PinId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.Plug1).WithMany().HasForeignKey(p => p.Plug1Id).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.Plug2).WithMany().HasForeignKey(p => p.Plug2Id).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.Socket1).WithMany().HasForeignKey(p => p.Socket1Id).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.Socket2).WithMany().HasForeignKey(p => p.Socket2Id).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.Flange).WithMany().HasForeignKey(p => p.FlangeId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.Clamp).WithMany().HasForeignKey(p => p.ClampId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.Omega).WithMany().HasForeignKey(p => p.OmegaId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.ConnectionSheet).WithMany().HasForeignKey(p => p.ConnectionSheetId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.ConnectionWire).WithMany().HasForeignKey(p => p.ConnectionWireId).OnDelete(DeleteBehavior.Restrict);
        
        builder.HasOne(p => p.Sand).WithMany().HasForeignKey(p => p.SandId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.MixedSand1).WithMany().HasForeignKey(p => p.MixedSand1Id).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.MixedSand2).WithMany().HasForeignKey(p => p.MixedSand2Id).OnDelete(DeleteBehavior.Restrict);
    }
}
