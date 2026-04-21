using OhmERP.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace OhmERP.Application.DTOs.Item;

public class ItemListDto
{
    public Guid Id { get; set; }

    [Display(Name = "Malzeme Kodu")]
    public string Code { get; set; } = string.Empty;

    [Display(Name = "Malzeme Adı")]
    public string Name { get; set; } = string.Empty;

    public Guid CategoryId { get; set; }

    [Display(Name = "Kategori")]
    public string CategoryName { get; set; } = string.Empty;

    public Guid UnitOfMeasureId { get; set; }

    [Display(Name = "Birim")]
    public string UnitOfMeasureName { get; set; } = string.Empty;

    public ItemType Type { get; set; }

    [Display(Name = "Tipi")]
    public string TypeName => Type.ToString();

    [Display(Name = "KDV Oranı (%)")]
    public decimal TaxRate { get; set; }

    [Display(Name = "Barkod")]
    public string? Barcode { get; set; }

    [Display(Name = "Kritik Stok Seviyesi")]
    public decimal CriticalStockLevel { get; set; }

    [Display(Name = "Durum")]
    public bool IsActive { get; set; }

    public List<OhmERP.Application.DTOs.ItemAttributeValue.ItemAttributeValueDto> DynamicAttributes { get; set; } = new();

    [Display(Name = "Açıklama")]
    public string? Description { get; set; }

    [Display(Name = "Birim Maliyet")]
    public decimal UnitCost { get; set; }

    [Display(Name = "Para Birimi")]
    public CurrencyType CostCurrency { get; set; }
}