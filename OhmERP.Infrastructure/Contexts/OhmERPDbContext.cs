using Microsoft.EntityFrameworkCore;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Common;
using OhmERP.Domain.Entities;
using OhmERP.Domain.Enums;
using OhmERP.Domain.Exceptions;
using OhmERP.Infrastructure.Auditing;

namespace OhmERP.Infrastructure.Contexts;

public class OhmERPDbContext : DbContext
{
    private readonly ICurrentUserService _currentUserService;

    public OhmERPDbContext(DbContextOptions<OhmERPDbContext> options, ICurrentUserService currentUserService) : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<City> Cities { get; set; }
    public DbSet<District> Districts { get; set; }
    public DbSet<CompanyContact> CompanyContacts { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<RolePermission> RolePermissions { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<Item> Items => Set<Item>();
    public DbSet<ItemCategory> ItemCategories => Set<ItemCategory>();
    public DbSet<UnitOfMeasure> UnitOfMeasures => Set<UnitOfMeasure>();
    public DbSet<CategoryAttribute> CategoryAttributes => Set<CategoryAttribute>();
    public DbSet<ItemAttributeValue> ItemAttributeValues => Set<ItemAttributeValue>();
    public DbSet<CodeTemplate> CodeTemplates { get; set; }
    public DbSet<WorkCenter> WorkCenters => Set<WorkCenter>();
    public DbSet<BOM> BOMs => Set<BOM>();
    public DbSet<BOMLine> BOMLines => Set<BOMLine>();
    public DbSet<BOMOperation> BOMOperations => Set<BOMOperation>();
    public DbSet<CurrencyRate> CurrencyRates => Set<CurrencyRate>();
    public DbSet<OverheadCost> OverheadCosts => Set<OverheadCost>();
    public DbSet<CostParameter> CostParameters => Set<CostParameter>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasSequence<int>("CompanyCode_Seq").StartsAt(0).IncrementsBy(1);
        modelBuilder.HasSequence<int>("ItemCode_Seq").StartsAt(0).IncrementsBy(1);
        modelBuilder.HasSequence<int>("WorkCenterCode_Seq").StartsAt(0).IncrementsBy(1);
        modelBuilder.HasSequence<int>("OverheadCostCode_Seq").StartsAt(0).IncrementsBy(1);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(OhmERPDbContext).Assembly);

        var seedDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var adminRoleId = Guid.Parse("d865c2e3-aa4c-4f46-9187-012112b96475");

        modelBuilder.Entity<Role>().HasData(
            new Role
            {
                Id = adminRoleId,
                Code = "ADMIN",
                Name = "Admin",
                Description = "Sistem Yönetici Rolü",
                CreatedDate = seedDate,
                CreatedBy = Guid.Empty,
                IsActive = true,
                IsDeleted = false,
                RowVersion = new byte[] { 1, 0, 0, 0, 0, 0, 0, 0 }
            }
        );
    }



    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var auditEntries = OnBeforeSaveChanges();
        DateTime turkeyTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("Turkey Standard Time"));

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedDate = turkeyTime;
                    entry.Entity.CreatedBy = _currentUserService.UserId;
                    entry.Entity.RowVersion = Guid.NewGuid().ToByteArray();
                    break;

                case EntityState.Modified:
                    var isDeletedProperty = entry.Property(x => x.IsDeleted);
                    if (isDeletedProperty.IsModified && (bool)isDeletedProperty.CurrentValue! == true && (bool)isDeletedProperty.OriginalValue! == false)
                    {
                        entry.Entity.DeletedDate = turkeyTime;
                        entry.Entity.DeletedBy = _currentUserService.UserId;
                    }
                    else
                    {
                        entry.Entity.UpdatedDate = turkeyTime;
                        entry.Entity.UpdatedBy = _currentUserService.UserId;
                    }
                    entry.Entity.RowVersion = Guid.NewGuid().ToByteArray();
                    break;
            }
        }

        ValidateSoftDeleteRelations();

        var result = await base.SaveChangesAsync(cancellationToken);
        await OnAfterSaveChangesAsync(auditEntries, cancellationToken);
        return result;
    }

    private void ValidateSoftDeleteRelations()
    {
        var softDeletedEntries = ChangeTracker.Entries<AuditableEntity>()
            .Where(e => e.State == EntityState.Modified)
            .Where(e =>
            {
                var prop = e.Property(x => x.IsDeleted);
                return prop.IsModified && (bool)prop.CurrentValue! == true && (bool)prop.OriginalValue! == false;
            })
            .ToList();

        foreach (var entry in softDeletedEntries)
        {
            var collectionNavigations = entry.Metadata.GetNavigations()
                .Where(n => n.IsCollection)
                .ToList();

            foreach (var navigation in collectionNavigations)
            {
                var collectionEntry = entry.Collection(navigation.Name);
                collectionEntry.Load();

                var relatedEntities = collectionEntry.CurrentValue;
                if (relatedEntities == null) continue;

                foreach (var related in relatedEntities)
                {
                    if (related is AuditableEntity auditable && !auditable.IsDeleted)
                    {
                        throw new RelationExistsException(
                            "Seçilen kaydın işlem görmüş hareketleri (bağlı alt kayıtları) bulunmaktadır. Bu kayıt silinemez.");
                    }
                }
            }
        }
    }

    private List<AuditEntry> OnBeforeSaveChanges()
    {
        ChangeTracker.DetectChanges();
        var auditEntries = new List<AuditEntry>();
        var userId = _currentUserService.UserId != Guid.Empty ? _currentUserService.UserId : (Guid?)null;

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is AuditLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                continue;

            string finalAuditType = entry.State.ToString();

            if (entry.State == EntityState.Modified && entry.Entity is AuditableEntity auditableEntity)
            {
                var isDeletedProperty = entry.Property(nameof(AuditableEntity.IsDeleted));
                if (isDeletedProperty.IsModified)
                {
                    bool isNowDeleted = (bool)isDeletedProperty.CurrentValue!;
                    bool wasDeleted = (bool)isDeletedProperty.OriginalValue!;

                    if (isNowDeleted && !wasDeleted) finalAuditType = "SoftDeleted";
                    else if (!isNowDeleted && wasDeleted) finalAuditType = "Restored";
                }
            }

            var auditEntry = new AuditEntry(entry)
            {
                TableName = entry.Metadata.GetTableName() ?? entry.Entity.GetType().Name,
                UserId = userId,
                AuditType = finalAuditType
            };

            auditEntries.Add(auditEntry);

            foreach (var property in entry.Properties)
            {
                if (property.IsTemporary)
                {
                    auditEntry.TemporaryProperties.Add(property);
                    continue;
                }

                string propertyName = property.Metadata.Name;

                if (property.Metadata.IsPrimaryKey())
                {
                    auditEntry.KeyValues[propertyName] = property.CurrentValue;
                }

                switch (entry.State)
                {
                    case EntityState.Added:
                        auditEntry.NewValues[propertyName] = property.CurrentValue;
                        break;
                    case EntityState.Deleted:
                        auditEntry.OldValues[propertyName] = property.OriginalValue;
                        break;
                    case EntityState.Modified:
                        if (property.IsModified)
                        {
                            auditEntry.OldValues[propertyName] = property.OriginalValue;
                            auditEntry.NewValues[propertyName] = property.CurrentValue;
                            auditEntry.ChangedColumns.Add(propertyName);
                        }
                        break;
                }
            }
        }

        foreach (var auditEntry in auditEntries.Where(_ => !_.HasTemporaryProperties))
        {
            AuditLogs.Add(auditEntry.ToAuditLog());
        }

        return auditEntries.Where(_ => _.HasTemporaryProperties).ToList();
    }

    private async Task OnAfterSaveChangesAsync(List<AuditEntry> auditEntries, CancellationToken cancellationToken)
    {
        if (auditEntries == null || auditEntries.Count == 0)
            return;

        foreach (var auditEntry in auditEntries)
        {
            foreach (var prop in auditEntry.TemporaryProperties)
            {
                if (prop.Metadata.IsPrimaryKey())
                {
                    auditEntry.KeyValues[prop.Metadata.Name] = prop.CurrentValue;
                }
                else
                {
                    auditEntry.NewValues[prop.Metadata.Name] = prop.CurrentValue;
                }
            }
            AuditLogs.Add(auditEntry.ToAuditLog());
        }

        await base.SaveChangesAsync(cancellationToken);
    }
}