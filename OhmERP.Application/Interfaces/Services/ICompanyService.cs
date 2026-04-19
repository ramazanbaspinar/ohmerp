using OhmERP.Application.DTOs.Company;

namespace OhmERP.Application.Interfaces.Services;

public interface ICompanyService : ICrudService<CompanyListDto, CreateCompanyRequest, UpdateCompanyRequest>
{
    Task<UpdateCompanyRequest> GetForUpdateAsync(Guid id);
}