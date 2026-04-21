namespace OhmERP.Application.DTOs.CostEngine;

public record CostCalculationRequest(Guid BOMId, decimal CurrentUsdRate, decimal CurrentEurRate);
