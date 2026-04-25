using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class OverheadCostConfiguration : IEntityTypeConfiguration<OverheadCost>
{
    public void Configure(EntityTypeBuilder<OverheadCost> builder)
    {
        builder.ToTable("OverheadCosts");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(x => x.Code)
            .IsUnique();

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.MonthlyAmount)
            .HasColumnType("decimal(18,4)");

        builder.Property(x => x.Currency)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasMaxLength(500);
    }
}
