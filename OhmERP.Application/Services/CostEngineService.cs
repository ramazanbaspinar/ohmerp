using OhmERP.Application.DTOs.CostEngine;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;
using OhmERP.Domain.Exceptions;
using OhmERP.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace OhmERP.Application.Services;

public class CostEngineService : ICostEngineService
{
    private readonly IGenericRepository<BOM> _bomRepository;

    public CostEngineService(IGenericRepository<BOM> bomRepository)
    {
        _bomRepository = bomRepository;
    }

    public async Task<CostCalculationResult> CalculateCostAsync(CostCalculationRequest request)
    {
        var boms = await _bomRepository.FindWithQueryAsync(query => query
            .Include(x => x.BOMLines)
                .ThenInclude(l => l.Material)
            .Include(x => x.BOMOperations)
                .ThenInclude(o => o.WorkCenter)
            .Where(x => x.Id == request.BOMId && !x.IsDeleted));

        var bom = boms.FirstOrDefault();
        if (bom == null)
            throw new BusinessException("Reçete (BOM) bulunamadı.");

        var result = new CostCalculationResult();

        foreach (var line in bom.BOMLines)
        {
            if (line.Material == null) continue;

            decimal unitPrice = line.Material.UnitCost;
            int currency = (int)line.Material.CostCurrency;

            decimal netQuantity = line.Quantity * (1 + (line.ScrapRate / 100m));
            decimal tlPrice = unitPrice;

            if (currency == (int)CurrencyType.USD) tlPrice = unitPrice * request.CurrentUsdRate;
            else if (currency == (int)CurrencyType.EUR) tlPrice = unitPrice * request.CurrentEurRate;

            decimal lineTotalCost = netQuantity * tlPrice;

            result.MaterialDetails.Add(new MaterialCostDetail
            {
                MaterialId = line.MaterialId,
                MaterialCode = line.Material.Code,
                MaterialName = line.Material.Name,
                Quantity = line.Quantity,
                ScrapRate = line.ScrapRate,
                NetQuantity = netQuantity,
                UnitPrice = unitPrice,
                Currency = currency,
                TotalCost = lineTotalCost
            });

            result.TotalMaterialCost += lineTotalCost;
        }

        foreach (var op in bom.BOMOperations)
        {
            if (op.WorkCenter == null) continue;

            decimal totalTimeMinutes = op.SetupTime + op.RunTime;
            decimal hourlyRate = op.WorkCenter.HourlyMachineCost + op.WorkCenter.HourlyLaborCost;
            int wcCurrency = (int)op.WorkCenter.Currency;

            decimal tlHourlyRate = hourlyRate;
            if (wcCurrency == (int)CurrencyType.USD) tlHourlyRate = hourlyRate * request.CurrentUsdRate;
            else if (wcCurrency == (int)CurrencyType.EUR) tlHourlyRate = hourlyRate * request.CurrentEurRate;

            decimal opTotalCost = (totalTimeMinutes / 60m) * tlHourlyRate;

            result.OperationDetails.Add(new OperationCostDetail
            {
                WorkCenterId = op.WorkCenterId,
                WorkCenterCode = op.WorkCenter.Code,
                WorkCenterName = op.WorkCenter.Name,
                OperationOrder = op.OperationOrder,
                SetupTime = op.SetupTime,
                RunTime = op.RunTime,
                TotalTimeMinutes = totalTimeMinutes,
                HourlyMachineCost = op.WorkCenter.HourlyMachineCost,
                HourlyLaborCost = op.WorkCenter.HourlyLaborCost,
                Currency = wcCurrency,
                TotalCost = opTotalCost
            });

            result.TotalOperationCost += opTotalCost;
        }

        result.GrandTotalCost = result.TotalMaterialCost + result.TotalOperationCost;

        return result;
    }
}
