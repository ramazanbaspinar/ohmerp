using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class CurrencyRateConfiguration : IEntityTypeConfiguration<CurrencyRate>
{
    public void Configure(EntityTypeBuilder<CurrencyRate> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CurrencyCode).IsRequired().HasMaxLength(3);
        builder.Property(x => x.BuyingRate).HasColumnType("decimal(18,4)");
        builder.Property(x => x.SellingRate).HasColumnType("decimal(18,4)");
        
        builder.HasIndex(x => new { x.Date, x.CurrencyCode }).IsUnique().HasFilter("[IsDeleted] = 0");
    }
}
