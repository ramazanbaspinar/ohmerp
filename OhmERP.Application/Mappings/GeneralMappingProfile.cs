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
        CreateMap<UpdateItemCategoryRequest, ItemCategory>().ReverseMap(); // Eklendi

        CreateMap<UnitOfMeasure, UnitOfMeasureListDto>();
        CreateMap<CreateUnitOfMeasureRequest, UnitOfMeasure>();
        CreateMap<UpdateUnitOfMeasureRequest, UnitOfMeasure>().ReverseMap(); // Eklendi

        CreateMap<Item, ItemListDto>()
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : string.Empty))
            .ForMember(dest => dest.UnitOfMeasureName, opt => opt.MapFrom(src => src.UnitOfMeasure != null ? src.UnitOfMeasure.Name : string.Empty));
        CreateMap<CreateItemRequest, Item>();
        CreateMap<UpdateItemRequest, Item>().ReverseMap(); // Eklendi

        CreateMap<CodeTemplate, CodeTemplateDto>().ReverseMap();
        CreateMap<UpdateCodeTemplateRequest, CodeTemplate>();
    }
}