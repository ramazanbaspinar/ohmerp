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
                query = query.Where(x => x.Type == (OhmERP.Domain.Enums.WorkCenterType)filter.Type.Value);
            }

            return query;
        };
    }

    public override async Task<byte[]> ExportToPdfAsync(string reportName = "İş Merkezleri Raporu", PaginationFilter? filter = null)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var data = filter != null ? await GetFilteredDataAsync(filter) : await GetAllAsync();

        var properties = typeof(WorkCenterListDto).GetProperties()
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
                            string textValue = string.Empty;

                            if (value is bool b)
                            {
                                textValue = b ? "Aktif" : "Pasif";
                            }
                            else if ((prop.Name == "HourlyMachineCost" || prop.Name == "HourlyLaborCost") && value is decimal decimalValue)
                            {
                                textValue = decimalValue.ToString("0.####", new CultureInfo("tr-TR"));
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

    protected override async Task ValidateCreateAsync(CreateWorkCenterRequest request)
    {
        if (await _repository.AnyAsync(x => x.Code == request.Code.Trim() && !x.IsDeleted))
            throw new BusinessException("Aynı Kodla başka makine olamaz.");
    }

    protected override async Task ValidateUpdateAsync(Guid id, UpdateWorkCenterRequest request, WorkCenter entity)
    {
        if (await _repository.AnyAsync(x => x.Code == request.Code.Trim() && x.Id != id && !x.IsDeleted))
            throw new BusinessException("Aynı Kodla başka makine olamaz.");
    }
}
