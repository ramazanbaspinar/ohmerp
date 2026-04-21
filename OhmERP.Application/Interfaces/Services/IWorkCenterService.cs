using OhmERP.Application.DTOs.WorkCenter;

namespace OhmERP.Application.Interfaces.Services;

public interface IWorkCenterService : ICrudService<WorkCenterListDto, CreateWorkCenterRequest, UpdateWorkCenterRequest>
{
}
