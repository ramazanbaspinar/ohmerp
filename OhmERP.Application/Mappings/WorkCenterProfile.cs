using AutoMapper;
using OhmERP.Application.DTOs.WorkCenter;
using OhmERP.Domain.Entities;

namespace OhmERP.Application.Mappings;

public class WorkCenterProfile : Profile
{
    public WorkCenterProfile()
    {
        CreateMap<WorkCenter, WorkCenterListDto>();
        CreateMap<CreateWorkCenterRequest, WorkCenter>();
        CreateMap<UpdateWorkCenterRequest, WorkCenter>();
    }
}
