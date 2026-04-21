using System.ComponentModel.DataAnnotations;

namespace OhmERP.Application.DTOs.ItemCategory;

public class ItemCategoryListDto
{
    public Guid Id { get; set; }

    [Display(Name = "Kategori Kodu")]
    public string Code { get; set; } = string.Empty;

    [Display(Name = "Kategori Adı")]
    public string Name { get; set; } = string.Empty;

    public Guid? ParentId { get; set; }

    [Display(Name = "Üst Kategori")]
    public string? ParentName { get; set; } 

    [Display(Name = "Durum")]
    public bool IsActive { get; set; }

    public bool ShowInMenu { get; set; }

    [Display(Name = "Açıklama")]
    public string? Description { get; set; }

    public Guid? DefaultUnitOfMeasureId { get; set; }
    
    [Display(Name = "Varsayılan Ölçü Birimi")]
    public string? DefaultUnitOfMeasureName { get; set; }
}