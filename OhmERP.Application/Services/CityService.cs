using AutoMapper;
using OhmERP.Application.DTOs.City;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;
using OhmERP.Domain.Exceptions;

namespace OhmERP.Application.Services;

public class CityService : BaseService<City, CityDto, CreateCityRequest, UpdateCityRequest>, ICityService
{
    protected override string CacheKey => "city_list_all";

    public CityService(IGenericRepository<City> repository, IUnitOfWork unitOfWork, IMapper mapper, ICacheService cacheService)
        : base(repository, unitOfWork, mapper, cacheService)
    {
    }

    protected override Func<IQueryable<City>, IQueryable<City>> BuildFilter(PaginationFilter filter)
    {
        return query =>
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => (x.Name != null && x.Name.Contains(filter.Search)) ||
                                         (x.PlateCode != null && x.PlateCode.Contains(filter.Search)));
            }

            return query;
        };
    }

    public override async Task<Guid> CreateAsync(CreateCityRequest request)
    {
        var plate = request.PlateCode?.Trim();
        
        if (!string.IsNullOrEmpty(plate))
        {
            var existingPlateCheck = await _repository.FindAsync(x => x.PlateCode == plate);
            var existingCityByPlate = existingPlateCheck.FirstOrDefault();

            if (existingCityByPlate != null)
            {
                if (!existingCityByPlate.IsDeleted)
                {
                    throw new BusinessException("Bu plaka kodu zaten mevcut.");
                }

                existingCityByPlate.IsDeleted = false;
                existingCityByPlate.DeletedBy = null;
                existingCityByPlate.DeletedDate = null;

                _mapper.Map(request, existingCityByPlate);
                
                _repository.Update(existingCityByPlate);
                await _unitOfWork.SaveChangesAsync();
                await _cacheService.RemoveByPrefixAsync(CacheKey);
                
                return existingCityByPlate.Id;
            }
        }

        return await base.CreateAsync(request);
    }

    protected override async Task ValidateCreateAsync(CreateCityRequest request)
    {
        var name = request.Name.Trim();
        var plate = request.PlateCode.Trim();
        var conflictCheck = await _repository.FindAsync(x => x.Name == name || x.PlateCode == plate);

        if (conflictCheck.Any(x => !x.IsDeleted))
            throw new BusinessException("Bu Şehir Adı veya Plaka Kodu aktif olarak kullanılmaktadır.");
    }

    protected override async Task ValidateUpdateAsync(Guid id, UpdateCityRequest request, City entity)
    {
        var name = request.Name.Trim();
        var plate = request.PlateCode.Trim();
        var conflictCheck = await _repository.FindAsync(x => x.Id != id && (x.Name == name || x.PlateCode == plate));

        if (conflictCheck.Any(x => !x.IsDeleted))
            throw new BusinessException("Bu Şehir Adı veya Plaka Kodu başka bir kayıtta kullanılmaktadır.");
    }
}