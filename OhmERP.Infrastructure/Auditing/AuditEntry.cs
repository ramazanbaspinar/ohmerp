using Microsoft.EntityFrameworkCore.ChangeTracking;
using OhmERP.Domain.Entities;
using System.Text.Json;

namespace OhmERP.Infrastructure.Auditing;

public class AuditEntry
{
    public EntityEntry Entry { get; }
    public Guid? UserId { get; set; }
    public string TableName { get; set; } = string.Empty;
    public Dictionary<string, object?> KeyValues { get; } = new();
    public Dictionary<string, object?> OldValues { get; } = new();
    public Dictionary<string, object?> NewValues { get; } = new();
    public List<string> ChangedColumns { get; } = new();
    public string AuditType { get; set; } = string.Empty;
    public List<PropertyEntry> TemporaryProperties { get; } = new();

    public bool HasTemporaryProperties => TemporaryProperties.Any();

    public AuditEntry(EntityEntry entry)
    {
        Entry = entry;
    }

    public AuditLog ToAuditLog()
    {
        return new AuditLog
        {
            UserId = UserId,
            Type = AuditType,
            TableName = TableName,
            DateTime = DateTime.UtcNow,
            PrimaryKey = JsonSerializer.Serialize(KeyValues),
            OldValues = OldValues.Count == 0 ? "{}" : JsonSerializer.Serialize(OldValues),
            NewValues = NewValues.Count == 0 ? "{}" : JsonSerializer.Serialize(NewValues),
            AffectedColumns = ChangedColumns.Count == 0 ? "[]" : JsonSerializer.Serialize(ChangedColumns)
        };
    }
}