using OhmERP.Domain.Exceptions;
using AutoMapper;
using ClosedXML.Excel;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Common;
using QuestPDF.Infrastructure;
using System.ComponentModel.DataAnnotations;
using System.Reflection;
using QuestPDF.Fluent;
using QuestPDF.Helpers;

namespace OhmERP.Application.Services;

public abstract class BaseService<TEntity, TDto, TCreateRequest, TUpdateRequest> : ICrudService<TDto, TCreateRequest, TUpdateRequest>
    where TEntity : AuditableEntity
{
    protected readonly IGenericRepository<TEntity> _repository;
    protected readonly IUnitOfWork _unitOfWork;
    protected readonly IMapper _mapper;
    protected readonly ICacheService _cacheService;
    protected abstract string CacheKey { get; }

    protected BaseService(IGenericRepository<TEntity> repository, IUnitOfWork unitOfWork, IMapper mapper, ICacheService cacheService)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _cacheService = cacheService;
    }

    public virtual async Task<List<TDto>> GetAllAsync()
    {
        var cachedData = await _cacheService.GetAsync<List<TDto>>(CacheKey);
        if (cachedData != null) return cachedData;

        var entities = await _repository.FindAsync(x => !x.IsDeleted);
        var sortedEntities = entities.OrderByDescending(x => x.CreatedDate).ToList();
        var dtos = _mapper.Map<List<TDto>>(sortedEntities);

        await _cacheService.SetAsync(CacheKey, dtos, TimeSpan.FromHours(1));
        return dtos;
    }

    protected virtual Func<IQueryable<TEntity>, IQueryable<TEntity>> BuildFilter(PaginationFilter filter)
    {
        return query => query;
    }

    public virtual async Task<PagedResult<TDto>> GetPagedAsync(PaginationFilter filter)
    {
        var filterFunc = BuildFilter(filter);
        Func<IQueryable<TEntity>, IQueryable<TEntity>> queryModifier = q => filterFunc(q.Where(x => !x.IsDeleted));

        var pagedData = await _repository.GetPagedWithQueryAsync(
            filter.Page,
            filter.PageSize,
            queryModifier: queryModifier,
            orderBy: q => q.OrderByDescending(x => x.CreatedDate));

        var dtos = _mapper.Map<List<TDto>>(pagedData.Items);

        return new PagedResult<TDto>
        {
            Items = dtos,
            TotalCount = pagedData.TotalCount,
            PageNumber = pagedData.PageNumber,
            PageSize = pagedData.PageSize,
            TotalPages = pagedData.TotalPages
        };
    }

    public virtual async Task<TDto> GetByIdAsync(Guid id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null) throw new BusinessException($"{typeof(TEntity).Name} bulunamadı.");
        if (entity.IsDeleted) throw new BusinessException($"{typeof(TEntity).Name} silinmiş.");

        return _mapper.Map<TDto>(entity);
    }

    public virtual async Task<Guid> CreateAsync(TCreateRequest request)
    {
        await ValidateCreateAsync(request);
        var entity = _mapper.Map<TEntity>(request);
        await _repository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        await _cacheService.RemoveByPrefixAsync(CacheKey);
        return entity.Id;
    }

    public virtual async Task UpdateAsync(Guid id, TUpdateRequest request)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null) throw new BusinessException($"{typeof(TEntity).Name} bulunamadı.");
        if (entity.IsDeleted) throw new BusinessException($"{typeof(TEntity).Name} silindiği için güncellenemez.");

        await ValidateUpdateAsync(id, request, entity);
        _mapper.Map(request, entity);
        _repository.Update(entity);
        await _unitOfWork.SaveChangesAsync();
        await _cacheService.RemoveByPrefixAsync(CacheKey);
    }

    public virtual async Task DeleteAsync(Guid id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null) throw new BusinessException($"{typeof(TEntity).Name} bulunamadı.");
        if (entity.IsDeleted) throw new BusinessException($"{typeof(TEntity).Name} zaten silinmiş.");

        _repository.Remove(entity);
        await _unitOfWork.SaveChangesAsync();
        await _cacheService.RemoveByPrefixAsync(CacheKey);
    }

    protected virtual async Task<List<TDto>> GetFilteredDataAsync(PaginationFilter filter)
    {
        var filterFunc = BuildFilter(filter);
        Func<IQueryable<TEntity>, IQueryable<TEntity>> queryModifier = q => filterFunc(q.Where(x => !x.IsDeleted));

        var entities = await _repository.FindWithQueryAsync(
            queryModifier: queryModifier,
            orderBy: q => q.OrderByDescending(x => x.CreatedDate));

        return _mapper.Map<List<TDto>>(entities);
    }

    public virtual async Task<byte[]> ExportToExcelAsync(string reportName = "Dışa Aktarım", PaginationFilter? filter = null)
    {
        var data = filter != null ? await GetFilteredDataAsync(filter) : await GetAllAsync();

        using var workbook = new XLWorkbook();

        string safeSheetName = reportName.Length > 31 ? reportName.Substring(0, 31) : reportName;
        var worksheet = workbook.Worksheets.Add(safeSheetName);

        if (data == null || !data.Any())
        {
            worksheet.Cell(1, 1).Value = "Veri bulunamadı.";
            using var emptyStream = new MemoryStream();
            workbook.SaveAs(emptyStream);
            return emptyStream.ToArray();
        }

        var properties = typeof(TDto).GetProperties()
            .Where(p => p.Name != "Id" && !p.Name.EndsWith("Id"))
            .ToList();

        for (int i = 0; i < properties.Count; i++)
        {
            var prop = properties[i];
            var displayAttribute = prop.GetCustomAttribute<DisplayAttribute>();

            string headerName = displayAttribute?.Name ?? prop.Name;

            worksheet.Cell(1, i + 1).Value = headerName;
        }

        var headerRow = worksheet.Range(1, 1, 1, properties.Count);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
        headerRow.Style.Border.BottomBorder = XLBorderStyleValues.Thin;

        int row = 2;
        foreach (var item in data)
        {
            for (int col = 0; col < properties.Count; col++)
            {
                var value = properties[col].GetValue(item, null);

                if (value is bool boolValue)
                {
                    worksheet.Cell(row, col + 1).Value = boolValue ? "Aktif" : "Pasif";
                }
                else
                {
                    worksheet.Cell(row, col + 1).Value = value?.ToString() ?? string.Empty;
                }
            }
            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public virtual async Task<byte[]> ExportToPdfAsync(string reportName = "Sistem Çıktısı", PaginationFilter? filter = null)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var data = filter != null ? await GetFilteredDataAsync(filter) : await GetAllAsync();

        var properties = typeof(TDto).GetProperties()
            .Where(p => p.Name != "Id" && !p.Name.EndsWith("Id"))
            .ToList();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(1, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text(reportName).SemiBold().FontSize(20).FontColor(Colors.Blue.Darken2);
                        col.Item().Text($"Oluşturulma Tarihi: {DateTime.Now:dd.MM.yyyy HH:mm}");
                    });
                });

                page.Content().PaddingVertical(1, Unit.Centimetre).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        for (int i = 0; i < properties.Count; i++)
                            columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        foreach (var prop in properties)
                        {
                            var displayAttribute = prop.GetCustomAttribute<DisplayAttribute>();
                            string headerName = displayAttribute?.Name ?? prop.Name;

                            header.Cell()
                                .BorderBottom(2)
                                .BorderColor(Colors.Black)
                                .PaddingBottom(5)
                                .Text(headerName)
                                .SemiBold();
                        }
                    });

                    foreach (var item in data)
                    {
                        foreach (var prop in properties)
                        {
                            var value = prop.GetValue(item, null);
                            string textValue = value is bool b ? (b ? "Aktif" : "Pasif") : (value?.ToString() ?? string.Empty);

                            table.Cell()
                                .BorderBottom(1)
                                .BorderColor(Colors.Grey.Lighten2)
                                .PaddingVertical(5)
                                .Text(textValue);
                        }
                    }
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Sayfa ");
                    x.CurrentPageNumber();
                    x.Span(" / ");
                    x.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }

    protected virtual Task ValidateCreateAsync(TCreateRequest request) => Task.CompletedTask;
    protected virtual Task ValidateUpdateAsync(Guid id, TUpdateRequest request, TEntity entity) => Task.CompletedTask;
}
