using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class TechnicalParameterConfiguration : IEntityTypeConfiguration<TechnicalParameter>
{
    public void Configure(EntityTypeBuilder<TechnicalParameter> builder)
    {
        builder.HasKey(x => x.Id);
        
        builder.Property(x => x.Code)
            .IsRequired()
            .HasMaxLength(50);
            
        builder.Property(x => x.Description)
            .HasMaxLength(250);
            
        builder.Property(x => x.NumericValue)
            .HasColumnType("decimal(18,2)");
    }
}
