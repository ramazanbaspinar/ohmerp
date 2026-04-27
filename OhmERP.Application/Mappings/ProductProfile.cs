using AutoMapper;
using OhmERP.Application.DTOs.Product;
using OhmERP.Domain.Entities;

namespace OhmERP.Application.Mappings;

public class ProductProfile : Profile
{
    public ProductProfile()
    {
        CreateMap<Product, ProductDto>();
        CreateMap<ProductInnerDetail, ProductInnerDetailDto>();
        CreateMap<ProductOperation, ProductOperationDto>();
        CreateMap<ProductImage, ProductImageDto>();

        CreateMap<CreateProductRequest, Product>()
            .ForMember(dest => dest.InnerDetail, opt => opt.Ignore())
            .ForMember(dest => dest.Operations, opt => opt.Ignore())
            .ForMember(dest => dest.Images, opt => opt.Ignore());

        CreateMap<CreateProductInnerDetailRequest, ProductInnerDetail>();
        CreateMap<CreateProductOperationRequest, ProductOperation>();
        CreateMap<CreateProductImageRequest, ProductImage>();
        
        CreateMap<UpdateProductRequest, Product>()
            .ForMember(dest => dest.InnerDetail, opt => opt.Ignore())
            .ForMember(dest => dest.Operations, opt => opt.Ignore())
            .ForMember(dest => dest.Images, opt => opt.Ignore());
    }
}
