using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OhmERP.Domain.Entities;

namespace OhmERP.Infrastructure.Configurations;

public class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.RoleId)
            .IsRequired();

        builder.Property(x => x.PermissionCode)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(x => new { x.RoleId, x.PermissionCode }).IsUnique();

        builder.HasOne(rp => rp.Role)
            .WithMany(r => r.RolePermissions)
            .HasForeignKey(rp => rp.RoleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}