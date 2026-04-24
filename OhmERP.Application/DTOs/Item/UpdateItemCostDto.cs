using OhmERP.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace OhmERP.Application.DTOs.Item;

public class UpdateItemCostDto
{
    [Required]
    public decimal UnitCost { get; set; }
    
    [Required]
    public CurrencyType Currency { get; set; }
}
