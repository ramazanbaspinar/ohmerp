using OhmERP.Domain.Common;

namespace OhmERP.Domain.Entities;

public class Product : AuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    
    public Guid FirmId { get; set; }
    public Company Firm { get; set; } = null!;

    public Guid VoltParameterId { get; set; }
    public TechnicalParameter VoltParameter { get; set; } = null!;

    public Guid WattParameterId { get; set; }
    public TechnicalParameter WattParameter { get; set; } = null!;

    public decimal OhmValue { get; set; }

    public decimal PipeLength { get; set; }
    public decimal? RolledLength { get; set; }
    
    public Guid WireId { get; set; }
    public Item Wire { get; set; } = null!;
    
    public bool IsDoubleWound { get; set; }

    public Guid SheetId { get; set; }
    public Item Sheet { get; set; } = null!;

    public Guid GasId { get; set; }
    public Item Gas { get; set; } = null!;

    public Guid PinId { get; set; }
    public Item Pin { get; set; } = null!;

    public Guid Plug1Id { get; set; }
    public Item Plug1 { get; set; } = null!;
    public int Plug1Qty { get; set; }

    public Guid? Plug2Id { get; set; }
    public Item? Plug2 { get; set; }
    public int? Plug2Qty { get; set; }

    public Guid Socket1Id { get; set; }
    public Item Socket1 { get; set; } = null!;
    public int Socket1Qty { get; set; }

    public Guid? Socket2Id { get; set; }
    public Item? Socket2 { get; set; }
    public int? Socket2Qty { get; set; }

    public Guid? FlangeId { get; set; }
    public Item? Flange { get; set; }
    public int? FlangeQty { get; set; }

    public Guid? ClampId { get; set; }
    public Item? Clamp { get; set; }
    public int? ClampQty { get; set; }

    public Guid? OmegaId { get; set; }
    public Item? Omega { get; set; }
    public int? OmegaQty { get; set; }

    public Guid? ConnectionSheetId { get; set; }
    public Item? ConnectionSheet { get; set; }
    public int? ConnectionSheetQty { get; set; }

    public Guid? ConnectionWireId { get; set; }
    public Item? ConnectionWire { get; set; }
    public int? ConnectionWireQty { get; set; }
    public decimal? ConnectionWireLength { get; set; }

    public string IsOvened { get; set; } = string.Empty;
    public string Marking { get; set; } = string.Empty;
    public string PackageType { get; set; } = string.Empty;

    public Guid? SandId { get; set; }
    public Item? Sand { get; set; }
    
    public bool IsMixedSand { get; set; }
    
    public Guid? MixedSand1Id { get; set; }
    public Item? MixedSand1 { get; set; }
    public decimal? MixedSand1Ratio { get; set; }
    
    public Guid? MixedSand2Id { get; set; }
    public Item? MixedSand2 { get; set; }
    public decimal? MixedSand2Ratio { get; set; }

    public string? Description { get; set; }

    public ProductInnerDetail? InnerDetail { get; set; }
    public ICollection<ProductOperation> Operations { get; set; } = new List<ProductOperation>();
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
}
