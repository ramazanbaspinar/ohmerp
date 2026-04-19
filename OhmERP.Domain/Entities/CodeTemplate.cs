using OhmERP.Domain.Common;
using OhmERP.Domain.Enums;

namespace OhmERP.Domain.Entities;




public class CodeTemplate : BaseEntity
{
    public DocumentType DocumentType { get; set; }
    public string Prefix { get; set; } = string.Empty;
    public string? Suffix { get; set; }
    public int Padding { get; set; } = 5;
    public bool UseDate { get; set; } = false;
    public string? DateFormat { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsManualEntryAllowed { get; set; } = false;
}
