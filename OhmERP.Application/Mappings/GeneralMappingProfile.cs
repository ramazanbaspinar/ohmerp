using AutoMapper;
using OhmERP.Application.DTOs.AuditLog;
using OhmERP.Application.DTOs.City;
using OhmERP.Application.DTOs.Company;
using OhmERP.Application.DTOs.District;
using OhmERP.Application.DTOs.Item;
using OhmERP.Application.DTOs.ItemCategory;
using OhmERP.Application.DTOs.Role;
using OhmERP.Application.DTOs.UnitOfMeasure;
using OhmERP.Application.DTOs.User;
using OhmERP.Application.DTOs.CodeTemplate;
using OhmERP.Application.DTOs.CategoryAttribute;
using OhmERP.Application.DTOs.ItemAttributeValue;
using OhmERP.Domain.Entities;

namespace OhmERP.Application.Mappings;

public class GeneralMappingProfile : Profile
{
    public GeneralMappingProfile()
    {
        CreateMap<City, CityDto>().ReverseMap();
        CreateMap<CreateCityRequest, City>();
        CreateMap<UpdateCityRequest, City>().ReverseMap();

        CreateMap<District, DistrictDto>().ReverseMap();
        CreateMap<CreateDistrictRequest, District>();
        CreateMap<UpdateDistrictRequest, District>().ReverseMap();

        CreateMap<Role, RoleDto>().ReverseMap();
        CreateMap<User, UserListDto>().ReverseMap();

        CreateMap<AuditLog, AuditLogDto>().ReverseMap();

        CreateMap<Company, CompanyListDto>().ReverseMap();
        CreateMap<CreateCompanyRequest, Company>();
        CreateMap<UpdateCompanyRequest, Company>().ReverseMap();

        CreateMap<ItemCategory, ItemCategoryListDto>()
            .ForMember(dest => dest.ParentName, opt => opt.MapFrom(src => src.Parent != null ? src.Parent.Name : null));
        CreateMap<CreateItemCategoryRequest, ItemCategory>();
        CreateMap<UpdateItemCategoryRequest, ItemCategory>()
            .ForMember(dest => dest.RowVersion, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.DeletedBy, opt => opt.Ignore())
            .ForMember(dest => dest.DeletedDate, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
            .ReverseMap();

        CreateMap<UnitOfMeasure, UnitOfMeasureListDto>();
        CreateMap<CreateUnitOfMeasureRequest, UnitOfMeasure>();
        CreateMap<UpdateUnitOfMeasureRequest, UnitOfMeasure>().ReverseMap(); // Eklendi

        CreateMap<Item, ItemListDto>()
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : string.Empty))
            .ForMember(dest => dest.UnitOfMeasureName, opt => opt.MapFrom(src => src.UnitOfMeasure != null ? src.UnitOfMeasure.Name : string.Empty))
            .ForMember(dest => dest.DynamicAttributes, opt => opt.MapFrom(src => src.AttributeValues));
        CreateMap<CreateItemRequest, Item>()
            .ForMember(dest => dest.AttributeValues, opt => opt.Ignore());

        CreateMap<UpdateItemRequest, Item>()
            .ForMember(dest => dest.AttributeValues, opt => opt.Ignore())
            .ForMember(dest => dest.RowVersion, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.DeletedBy, opt => opt.Ignore())
            .ForMember(dest => dest.DeletedDate, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
            .ReverseMap();

        CreateMap<CodeTemplate, CodeTemplateDto>().ReverseMap();
        CreateMap<CreateCodeTemplateRequest, CodeTemplate>();
        CreateMap<UpdateCodeTemplateRequest, CodeTemplate>();

        CreateMap<CategoryAttribute, CategoryAttributeDto>().ReverseMap();
        CreateMap<CreateCategoryAttributeRequest, CategoryAttribute>();
        CreateMap<UpdateCategoryAttributeRequest, CategoryAttribute>()
            .ForMember(dest => dest.RowVersion, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.DeletedBy, opt => opt.Ignore())
            .ForMember(dest => dest.DeletedDate, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
            .ReverseMap();

        CreateMap<ItemAttributeValue, ItemAttributeValueDto>().ReverseMap();
    }
}