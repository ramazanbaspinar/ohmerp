using System.ComponentModel.DataAnnotations;

namespace OhmERP.Application.DTOs.CategoryAttribute;

public class CreateCategoryAttributeRequest
{
    [Required(ErrorMessage = "Kategori ID zorunludur.")]
    public Guid ItemCategoryId { get; set; }

    [Required(ErrorMessage = "Özellik Adı zorunludur.")]
    [StringLength(100, ErrorMessage = "Özellik Adı en fazla 100 karakter olabilir.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Veri Tipi zorunludur.")]
    public string DataType { get; set; } = string.Empty;

    public int? Precision { get; set; }

    public bool IsRequired { get; set; }

    public int SortOrder { get; set; }
}
