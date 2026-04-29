using AutoMapper;
using System.Globalization;
using System.Reflection;
using System.ComponentModel.DataAnnotations;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.WorkCenter;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;
using OhmERP.Domain.Exceptions;

namespace OhmERP.Application.Services;

public class WorkCenterService : BaseService<WorkCenter, WorkCenterListDto, CreateWorkCenterRequest, UpdateWorkCenterRequest>, IWorkCenterService
{
    protected override string CacheKey => "workcenter_list_all";

    private readonly INumeratorService _numeratorService;

    public WorkCenterService(
        IGenericRepository<WorkCenter> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICacheService cacheService,
        INumeratorService numeratorService)
        : base(repository, unitOfWork, mapper, cacheService)
    {
        _numeratorService = numeratorService;
    }

    public override async Task<Guid> CreateAsync(CreateWorkCenterRequest request)
    {
        var previewInfo = await _numeratorService.PreviewNextCodeAsync(OhmERP.Domain.Enums.DocumentType.WorkCenter);

        if (string.IsNullOrWhiteSpace(request.Code) || 
            request.Code.Trim() == "Yükleniyor..." || 
            request.Code.Trim() == previewInfo.NextCode)
        {
            request.Code = await _numeratorService.GenerateNextCodeAsync(OhmERP.Domain.Enums.DocumentType.WorkCenter);
        }

        return await base.CreateAsync(request);
    }

    public override async Task<PagedResult<WorkCenterListDto>> GetPagedAsync(PaginationFilter filter)
    {
        var filterFunc = BuildFilter(filter);
        Func<IQueryable<WorkCenter>, IQueryable<WorkCenter>> queryModifier = q => filterFunc(q.Where(x => !x.IsDeleted));

        Func<IQueryable<WorkCenter>, IOrderedQueryable<WorkCenter>>? orderBy = null;

        if (!string.IsNullOrEmpty(filter.SortBy))
        {
            orderBy = q => filter.SortBy.ToLower() switch
            {
                "code" => filter.SortDesc ? q.OrderByDescending(x => x.Code) : q.OrderBy(x => x.Code),
                "name" => filter.SortDesc ? q.OrderByDescending(x => x.Name) : q.OrderBy(x => x.Name),

                _ => q.OrderByDescending(x => x.CreatedDate)
            };
        }
        else
        {
            orderBy = q => q.OrderByDescending(x => x.CreatedDate);
        }

        var pagedData = await _repository.GetPagedWithQueryAsync(
            filter.Page,
            filter.PageSize,
            queryModifier: queryModifier,
            orderBy: orderBy);

        var dtos = _mapper.Map<List<WorkCenterListDto>>(pagedData.Items);

        return new PagedResult<WorkCenterListDto>
        {
            Items = dtos,
            TotalCount = pagedData.TotalCount,
            PageNumber = pagedData.PageNumber,
            PageSize = pagedData.PageSize,
            TotalPages = pagedData.TotalPages
        };
    }

    protected override Func<IQueryable<WorkCenter>, IQueryable<WorkCenter>> BuildFilter(PaginationFilter filter)
    {
        return query =>
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => (x.Code != null && x.Code.Contains(filter.Search)) ||
                                         (x.Name != null && x.Name.Contains(filter.Search)));
            }

            if (filter.IsActive.HasValue)
            {
                query = query.Where(x => x.IsActive == filter.IsActive.Value);
            }

            if (filter.Type.HasValue)
            {
                query = query.Where(x => x.CalculationType == (OhmERP.Domain.Enums.MachineCalculationType)filter.Type.Value);
            }

            return query;
        };
    }

    public override async Task<byte[]> ExportToPdfAsync(string reportName = "İş Merkezleri Raporu", PaginationFilter? filter = null)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var data = filter != null ? await GetFilteredDataAsync(filter) : await GetAllAsync();

        var properties = typeof(WorkCenterListDto).GetProperties()
            .Where(p => p.Name != "Id" && !p.Name.EndsWith("Id") &&
                        (p.GetCustomAttribute<DisplayAttribute>()?.GetAutoGenerateField() != false))
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
                            string textValue = string.Empty;

                            if (value is bool b)
                            {
                                textValue = b ? "Aktif" : "Pasif";
                            }

                            else
                            {
                                textValue = value?.ToString() ?? string.Empty;
                            }

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

    protected override Task ValidateCreateAsync(CreateWorkCenterRequest request)
    {
        return Task.CompletedTask;
    }

    protected override Task ValidateUpdateAsync(Guid id, UpdateWorkCenterRequest request, WorkCenter entity)
    {
        return Task.CompletedTask;
    }
}
