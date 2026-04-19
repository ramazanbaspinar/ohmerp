using OhmERP.Domain.Exceptions;
using AutoMapper;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.District;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using OhmERP.Domain.Entities;

namespace OhmERP.Application.Services;

public class DistrictService : BaseService<District, DistrictDto, CreateDistrictRequest, UpdateDistrictRequest>, IDistrictService
{
    protected override string CacheKey => "district_list_all";
    private readonly IGenericRepository<City> _cityRepository;

    public DistrictService(
        IGenericRepository<District> repository,
        IGenericRepository<City> cityRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICacheService cacheService)
        : base(repository, unitOfWork, mapper, cacheService)
    {
        _cityRepository = cityRepository;
    }

    protected override Func<IQueryable<District>, IQueryable<District>> BuildFilter(PaginationFilter filter)
    {
        return query =>
        {
            query = query.Include(x => x.City);

            if (filter.CityId.HasValue)
            {
                query = query.Where(x => x.CityId == filter.CityId.Value);
            }

            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => x.Name != null && x.Name.Contains(filter.Search));
            }

            return query;
        };
    }

    public async Task<List<DistrictDto>> GetByCityIdAsync(Guid cityId)
    {
        var key = $"district_list_city_{cityId}";
        var cachedData = await _cacheService.GetAsync<List<DistrictDto>>(key);
        if (cachedData != null) return cachedData;

        var districts = await _repository.FindAsync(x => x.CityId == cityId && !x.IsDeleted);
        var city = await _cityRepository.GetByIdAsync(cityId);

        var districtList = districts
            .OrderBy(d => d.Name)
            .Select(d => new DistrictDto
            {
                Id = d.Id,
                Name = d.Name,
                CityId = d.CityId,
                CityName = city?.Name ?? string.Empty
            })
            .ToList();

        await _cacheService.SetAsync(key, districtList, TimeSpan.FromHours(1));
        return districtList;
    }

    protected override async Task ValidateCreateAsync(CreateDistrictRequest request)
    {
        var cityExists = await _cityRepository.GetByIdAsync(request.CityId);
        if (cityExists == null || cityExists.IsDeleted)
            throw new BusinessException("Belirtilen şehir bulunamadı veya silinmiş.");

        var name = request.Name.Trim();
        var conflictCheck = await _repository.FindAsync(x => x.CityId == request.CityId && x.Name == name && !x.IsDeleted);

        if (conflictCheck.Any()) throw new BusinessException("Bu ilçeden ilgili şehirde zaten aktif olarak mevcut.");
    }

    protected override async Task ValidateUpdateAsync(Guid id, UpdateDistrictRequest request, District entity)
    {
        if (entity.CityId != request.CityId)
        {
            var newCityExists = await _cityRepository.GetByIdAsync(request.CityId);
            if (newCityExists == null || newCityExists.IsDeleted)
                throw new BusinessException("Bağlanmak istenen yeni şehir bulunamadı.");
        }

        var name = request.Name.Trim();
        var conflictCheck = await _repository.FindAsync(x => x.Id != id && x.CityId == request.CityId && x.Name == name && !x.IsDeleted);

        if (conflictCheck.Any()) throw new BusinessException("Bu ilçeden ilgili şehirde zaten mevcut.");
    }
}
