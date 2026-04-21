namespace OhmERP.Application.Interfaces.Services;

public interface ICurrencyService
{
    Task SyncDailyRatesAsync();
    Task<decimal> GetRateAsync(string currencyCode, bool isSelling = true);
    Task<List<OhmERP.Domain.Entities.CurrencyRate>> GetTodayRatesAsync();
}
