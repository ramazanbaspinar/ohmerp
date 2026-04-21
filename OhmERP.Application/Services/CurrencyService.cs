using System.Xml;
using Microsoft.EntityFrameworkCore;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;

namespace OhmERP.Application.Services;

public class CurrencyService : ICurrencyService
{
    private readonly IGenericRepository<CurrencyRate> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public CurrencyService(IGenericRepository<CurrencyRate> repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task SyncDailyRatesAsync()
    {
        var today = DateTime.Today;
        var existingRates = await _repository.FindAsync(x => x.Date == today && !x.IsDeleted);



        try
        {
            using var client = new HttpClient();
            var xmlString = await client.GetStringAsync("https://www.tcmb.gov.tr/kurlar/today.xml");

            var doc = new XmlDocument();
            doc.LoadXml(xmlString);

            var currenciesToFetch = new[] { "USD", "EUR" };

            foreach (var code in currenciesToFetch)
            {
                var node = doc.SelectSingleNode($"//Currency[@CurrencyCode='{code}']");
                if (node != null)
                {
                    var forexBuying = node.SelectSingleNode("ForexBuying")?.InnerText?.Replace('.', ',');
                    var forexSelling = node.SelectSingleNode("ForexSelling")?.InnerText?.Replace('.', ',');

                    if (decimal.TryParse(forexBuying, out decimal buying) && decimal.TryParse(forexSelling, out decimal selling))
                    {
                        var existing = existingRates.FirstOrDefault(x => x.CurrencyCode == code);
                        if (existing == null)
                        {
                            await _repository.AddAsync(new CurrencyRate
                            {
                                Date = today,
                                CurrencyCode = code,
                                BuyingRate = buying,
                                SellingRate = selling
                            });
                        }
                        else
                        {
                            existing.BuyingRate = buying;
                            existing.SellingRate = selling;
                            _repository.Update(existing);
                        }
                    }
                }
            }

            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Log exception here (fallback allows manual entry)
            Console.WriteLine($"TCMB kur çekme hatası: {ex.Message}");
        }
    }

    public async Task<List<CurrencyRate>> GetTodayRatesAsync()
    {
        await SyncDailyRatesAsync();
        var today = DateTime.Today;
        var rates = await _repository.FindAsync(x => x.Date == today && !x.IsDeleted);
        return rates.ToList();
    }

    public async Task<decimal> GetRateAsync(string currencyCode, bool isSelling = true)
    {
        var todayRates = await GetTodayRatesAsync();
        var rate = todayRates.FirstOrDefault(x => x.CurrencyCode == currencyCode);
        
        if (rate != null)
        {
            return isSelling ? rate.SellingRate : rate.BuyingRate;
        }
        
        return 0m;
    }
}
