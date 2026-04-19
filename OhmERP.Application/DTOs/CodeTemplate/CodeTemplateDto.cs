using OhmERP.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace OhmERP.Application.DTOs.CodeTemplate;

public class CodeTemplateDto
{
    public Guid Id { get; set; }

    [Display(Name = "Modül / Kayıt Tipi")]
    public DocumentType DocumentType { get; set; }

    [Display(Name = "Önek")]
    public string Prefix { get; set; } = string.Empty;

    [Display(Name = "Sonek")]
    public string? Suffix { get; set; }

    [Display(Name = "Sayı Uzunluğu")]
    public int Padding { get; set; }

    [Display(Name = "Tarih Kullan")]
    public bool UseDate { get; set; }

    [Display(Name = "Tarih Formatı")]
    public string? DateFormat { get; set; }

    [Display(Name = "Durum")]
    public bool IsActive { get; set; }

    [Display(Name = "Manuel Girişe İzin Ver")]
    public bool IsManualEntryAllowed { get; set; }

    [Display(Name = "Son Numara")]
    public int CurrentNumber { get; set; }
}
