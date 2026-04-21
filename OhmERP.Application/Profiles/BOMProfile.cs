using AutoMapper;
using OhmERP.Application.DTOs.BOM;

namespace OhmERP.Application.Profiles;

public class BOMProfile : Profile
{
    public BOMProfile()
    {
        CreateMap<Domain.Entities.BOM, BOMListDto>()
            .ForMember(dest => dest.ItemName, opt => opt.MapFrom(src => src.Item != null ? src.Item.Name : string.Empty));
            
        CreateMap<Domain.Entities.BOM, BOMDto>();
        CreateMap<Domain.Entities.BOMLine, BOMLineDto>();
        CreateMap<Domain.Entities.BOMOperation, BOMOperationDto>();
            
        CreateMap<CreateBOMRequest, Domain.Entities.BOM>()
            .ForMember(dest => dest.BOMLines, opt => opt.Ignore())
            .ForMember(dest => dest.BOMOperations, opt => opt.Ignore());
            
        CreateMap<UpdateBOMRequest, Domain.Entities.BOM>()
            .ForMember(dest => dest.BOMLines, opt => opt.Ignore())
            .ForMember(dest => dest.BOMOperations, opt => opt.Ignore());
    }
}
