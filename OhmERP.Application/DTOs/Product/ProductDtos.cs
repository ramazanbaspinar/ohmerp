using System;
using System.Collections.Generic;

namespace OhmERP.Application.DTOs.Product;

public class ProductDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public Guid FirmId { get; set; }
    public Guid VoltParameterId { get; set; }
    public Guid WattParameterId { get; set; }
    public decimal OhmValue { get; set; }
    public decimal PipeLength { get; set; }
    public decimal RolledLength { get; set; }
    public Guid WireId { get; set; }
    public bool IsDoubleWound { get; set; }
    public Guid SheetId { get; set; }
    public Guid GasId { get; set; }
    public Guid PinId { get; set; }
    public Guid Plug1Id { get; set; }
    public Guid? Plug2Id { get; set; }
    public Guid Socket1Id { get; set; }
    public int Socket1Qty { get; set; }
    public Guid? Socket2Id { get; set; }
    public int? Socket2Qty { get; set; }
    public Guid? FlangeId { get; set; }
    public int? FlangeQty { get; set; }
    public Guid? ClampId { get; set; }
    public int? ClampQty { get; set; }
    public Guid? OmegaId { get; set; }
    public int? OmegaQty { get; set; }
    public Guid? ConnectionSheetId { get; set; }
    public int? ConnectionSheetQty { get; set; }
    public Guid? ConnectionWireId { get; set; }
    public int? ConnectionWireQty { get; set; }
    public decimal? ConnectionWireLength { get; set; }
    public string IsOvened { get; set; } = string.Empty;
    public string Marking { get; set; } = string.Empty;
    public string PackageType { get; set; } = string.Empty;
    public Guid? SandId { get; set; }
    public bool IsMixedSand { get; set; }
    public Guid? MixedSand1Id { get; set; }
    public decimal? MixedSand1Ratio { get; set; }
    public Guid? MixedSand2Id { get; set; }
    public decimal? MixedSand2Ratio { get; set; }
    public string? Description { get; set; }

    public ProductInnerDetailDto? InnerDetail { get; set; }
    public List<ProductOperationDto> Operations { get; set; } = new();
    public List<ProductImageDto> Images { get; set; } = new();
}

public class ProductInnerDetailDto
{
    public Guid Id { get; set; }
    public Guid InnerVoltParameterId { get; set; }
    public Guid InnerWattParameterId { get; set; }
    public decimal InnerOhmValue { get; set; }
    public decimal InnerPipeLength { get; set; }
    public decimal InnerRolledLength { get; set; }
    public Guid InnerWireId { get; set; }
    public bool InnerIsDoubleWound { get; set; }
    public Guid InnerSheetId { get; set; }
    public Guid InnerGasId { get; set; }
    public Guid InnerPinId { get; set; }
    public Guid InnerPlug1Id { get; set; }
    public Guid? InnerPlug2Id { get; set; }
    public Guid InnerSocket1Id { get; set; }
    public int InnerSocket1Qty { get; set; }
    public Guid? InnerSocket2Id { get; set; }
    public int? InnerSocket2Qty { get; set; }
    public string InnerIsOvened { get; set; } = string.Empty;
    public string InnerMarking { get; set; } = string.Empty;
    public string InnerPackageType { get; set; } = string.Empty;
    public Guid? InnerSandId { get; set; }
    public bool InnerIsMixedSand { get; set; }
    public Guid? InnerMixedSand1Id { get; set; }
    public decimal? InnerMixedSand1Ratio { get; set; }
    public Guid? InnerMixedSand2Id { get; set; }
    public decimal? InnerMixedSand2Ratio { get; set; }
    public string? InnerDescription { get; set; }
}

public class ProductOperationDto
{
    public Guid Id { get; set; }
    public Guid WorkCenterId { get; set; }
    public int SequenceOrder { get; set; }
    public decimal OperationTimeMinutes { get; set; }
    public bool IsInnerProductRoute { get; set; }
}

public class ProductImageDto
{
    public Guid Id { get; set; }
    public string ImageBase64 { get; set; } = string.Empty;
    public int SequenceOrder { get; set; }
}
