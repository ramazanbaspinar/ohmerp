using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class UnitOfMeasureConfiguration : IEntityTypeConfiguration<UnitOfMeasure>
{
    public void Configure(EntityTypeBuilder<UnitOfMeasure> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Code).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Description).HasMaxLength(200);

        builder.HasIndex(x => x.Code).IsUnique().HasFilter("[IsDeleted] = 0");
    }
}