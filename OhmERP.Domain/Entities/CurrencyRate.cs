using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class CurrencyRate : AuditableEntity
{
    public DateTime Date { get; set; }
    public string CurrencyCode { get; set; } = string.Empty;
    public decimal BuyingRate { get; set; }
    public decimal SellingRate { get; set; }
}
