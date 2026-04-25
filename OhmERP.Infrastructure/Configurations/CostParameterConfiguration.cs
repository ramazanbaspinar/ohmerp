using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class CostParameterConfiguration : IEntityTypeConfiguration<CostParameter>
{
    public void Configure(EntityTypeBuilder<CostParameter> builder)
    {
        builder.ToTable("CostParameters");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(x => x.Code)
            .IsUnique();

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.PercentageValue)
            .HasColumnType("decimal(18,4)");

        builder.Property(x => x.Description)
            .HasMaxLength(500);

        builder.HasData(
            new CostParameter
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Code = "FIRE_ORANI",
                Name = "Varsayılan Fire Oranı",
                PercentageValue = 5.0m,
                Description = "Üretim esnasında oluşacak varsayılan fire yüzdesi",
                CreatedBy = Guid.Empty,
                CreatedDate = new DateTime(2026, 1, 1),
                IsDeleted = false,
                RowVersion = new byte[] { 1, 0, 0, 0, 0, 0, 0, 0 },
                IsSystemDefined = true
            },
            new CostParameter
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Code = "VADE_FARKI",
                Name = "Vade Farkı",
                PercentageValue = 3.5m,
                Description = "Satışlarda uygulanacak varsayılan vade farkı yüzdesi",
                CreatedBy = Guid.Empty,
                CreatedDate = new DateTime(2026, 1, 1),
                IsDeleted = false,
                RowVersion = new byte[] { 1, 0, 0, 0, 0, 0, 0, 0 },
                IsSystemDefined = true
            },
            new CostParameter
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Code = "KDV_ORANI",
                Name = "KDV Oranı",
                PercentageValue = 20.0m,
                Description = "Sistem geneli varsayılan KDV Oranı",
                CreatedBy = Guid.Empty,
                CreatedDate = new DateTime(2026, 1, 1),
                IsDeleted = false,
                RowVersion = new byte[] { 1, 0, 0, 0, 0, 0, 0, 0 },
                IsSystemDefined = true
            }
        );
    }
}
