using OhmERP.Domain.Enums;

namespace OhmERP.Application.DTOs.CodeTemplate;

public class CreateCodeTemplateRequest
{
    public DocumentType DocumentType { get; set; }
    public string Prefix { get; set; } = string.Empty;
    public string? Suffix { get; set; }
    public int Padding { get; set; }
    public bool UseDate { get; set; }
    public string? DateFormat { get; set; }
    public bool IsActive { get; set; }
    public bool IsManualEntryAllowed { get; set; }
    public int CurrentNumber { get; set; }
}
