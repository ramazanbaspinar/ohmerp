using OhmERP.Domain.Exceptions;
using AutoMapper;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.Company;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using OhmERP.Domain.Entities;
using OhmERP.Domain.Enums;

namespace OhmERP.Application.Services;

public class CompanyService : BaseService<Company, CompanyListDto, CreateCompanyRequest, UpdateCompanyRequest>, ICompanyService
{
    protected override string CacheKey => "company_list_all";
    private readonly INumeratorService _numeratorService;

    public CompanyService(
        IGenericRepository<Company> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICacheService cacheService,
        INumeratorService numeratorService)
        : base(repository, unitOfWork, mapper, cacheService)
    {
        _numeratorService = numeratorService;
    }

    public override async Task<Guid> CreateAsync(CreateCompanyRequest request)
    {
        var previewInfo = await _numeratorService.PreviewNextCodeAsync(DocumentType.Company);

        if (string.IsNullOrWhiteSpace(request.Code) || 
            request.Code.Trim() == "Yükleniyor..." || 
            request.Code.Trim() == previewInfo.NextCode)
        {
            request.Code = await _numeratorService.GenerateNextCodeAsync(DocumentType.Company);
        }

        return await base.CreateAsync(request);
    }

    protected override Func<IQueryable<Company>, IQueryable<Company>> BuildFilter(PaginationFilter filter)
    {
        return query =>
        {
            query = query.Include(x => x.City).Include(x => x.District);

            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => (x.Code != null && x.Code.Contains(filter.Search)) ||
                                         (x.Name != null && x.Name.Contains(filter.Search)) ||
                                         (x.TaxNumber != null && x.TaxNumber.Contains(filter.Search)));
            }

            if (filter.IsActive.HasValue)
            {
                query = query.Where(x => x.IsActive == filter.IsActive.Value);
            }

            if (filter.Type.HasValue)
            {
                query = query.Where(x => (int)x.Type == filter.Type.Value);
            }

            return query;
        };
    }

    public async Task<UpdateCompanyRequest> GetForUpdateAsync(Guid id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null || entity.IsDeleted)
            throw new BusinessException("Cari kart bulunamadı.");

        return _mapper.Map<UpdateCompanyRequest>(entity);
    }

    public override async Task DeleteAsync(Guid id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null || entity.IsDeleted)
            throw new BusinessException("Silinecek cari kart bulunamadı.");

        _repository.Remove(entity);
        await _unitOfWork.SaveChangesAsync();
        await _cacheService.RemoveAsync(CacheKey);
    }

    protected override async Task ValidateCreateAsync(CreateCompanyRequest request)
    {
        if (await _repository.AnyAsync(x => x.Code == request.Code && !x.IsDeleted))
            throw new BusinessException("Girilen sistem kodu zaten başka bir kayıtta kullanılmaktadır. Lütfen farklı bir kod giriniz.");
    }

    protected override async Task ValidateUpdateAsync(Guid id, UpdateCompanyRequest request, Company entity)
    {
        if (await _repository.AnyAsync(x => x.Code == request.Code && x.Id != id && !x.IsDeleted))
            throw new BusinessException("Girilen sistem kodu zaten başka bir kayıtta kullanılmaktadır. Lütfen farklı bir kod giriniz.");
    }
}
