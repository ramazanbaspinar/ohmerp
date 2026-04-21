using OhmERP.Application.DTOs.CostEngine;

namespace OhmERP.Application.Interfaces.Services;

public interface ICostEngineService
{
    Task<CostCalculationResult> CalculateCostAsync(CostCalculationRequest request);
}
