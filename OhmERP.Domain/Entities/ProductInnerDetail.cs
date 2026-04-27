using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class ProductInnerDetail : AuditableEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid InnerVoltParameterId { get; set; }
    public TechnicalParameter InnerVoltParameter { get; set; } = null!;

    public Guid InnerWattParameterId { get; set; }
    public TechnicalParameter InnerWattParameter { get; set; } = null!;

    public decimal InnerOhmValue { get; set; }

    public decimal InnerPipeLength { get; set; }
    public decimal InnerRolledLength { get; set; }
    
    public Guid InnerWireId { get; set; }
    public Item InnerWire { get; set; } = null!;
    
    public bool InnerIsDoubleWound { get; set; }

    public Guid InnerSheetId { get; set; }
    public Item InnerSheet { get; set; } = null!;

    public Guid InnerGasId { get; set; }
    public Item InnerGas { get; set; } = null!;

    public Guid InnerPinId { get; set; }
    public Item InnerPin { get; set; } = null!;

    public Guid InnerPlug1Id { get; set; }
    public Item InnerPlug1 { get; set; } = null!;

    public Guid? InnerPlug2Id { get; set; }
    public Item? InnerPlug2 { get; set; }

    public Guid InnerSocket1Id { get; set; }
    public Item InnerSocket1 { get; set; } = null!;
    public int InnerSocket1Qty { get; set; }

    public Guid? InnerSocket2Id { get; set; }
    public Item? InnerSocket2 { get; set; }
    public int? InnerSocket2Qty { get; set; }

    public string InnerIsOvened { get; set; } = string.Empty;
    public string InnerMarking { get; set; } = string.Empty;
    public string InnerPackageType { get; set; } = string.Empty;

    public Guid? InnerSandId { get; set; }
    public Item? InnerSand { get; set; }
    
    public bool InnerIsMixedSand { get; set; }
    
    public Guid? InnerMixedSand1Id { get; set; }
    public Item? InnerMixedSand1 { get; set; }
    public decimal? InnerMixedSand1Ratio { get; set; }
    
    public Guid? InnerMixedSand2Id { get; set; }
    public Item? InnerMixedSand2 { get; set; }
    public decimal? InnerMixedSand2Ratio { get; set; }

    public string? InnerDescription { get; set; }
}
