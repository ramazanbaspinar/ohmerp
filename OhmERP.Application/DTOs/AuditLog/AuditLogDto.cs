namespace OhmERP.Application.DTOs.AuditLog;

public class AuditLogDto
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string TableName { get; set; } = string.Empty;
    public DateTime DateTime { get; set; }
    public string OldValues { get; set; } = string.Empty;
    public string NewValues { get; set; } = string.Empty;
    public string AffectedColumns { get; set; } = string.Empty;
    public string PrimaryKey { get; set; } = string.Empty;
}