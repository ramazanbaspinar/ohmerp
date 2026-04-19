using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Type).IsRequired().HasMaxLength(50);
        builder.Property(x => x.TableName).IsRequired().HasMaxLength(200);
        builder.Property(x => x.DateTime).IsRequired();

        builder.Property(x => x.PrimaryKey).HasColumnType("nvarchar(max)");
        builder.Property(x => x.OldValues).HasColumnType("nvarchar(max)");
        builder.Property(x => x.NewValues).HasColumnType("nvarchar(max)");
        builder.Property(x => x.AffectedColumns).HasColumnType("nvarchar(max)");

        builder.HasIndex(x => x.TableName);
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.DateTime);
    }
}