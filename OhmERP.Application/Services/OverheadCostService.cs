using AutoMapper;
using OhmERP.Application.DTOs.OverheadCost;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;
using OhmERP.Domain.Exceptions;
using System.Reflection;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using OhmERP.Domain.Enums;

namespace OhmERP.Application.Services;

public class OverheadCostService : BaseService<OverheadCost, OverheadCostListDto, CreateOverheadCostRequest, UpdateOverheadCostRequest>, IOverheadCostService
{
    protected override string CacheKey => "overhead_cost_list_all";
    private readonly INumeratorService _numeratorService;

    public OverheadCostService(IGenericRepository<OverheadCost> repository, IUnitOfWork unitOfWork, IMapper mapper, ICacheService cacheService, INumeratorService numeratorService)
        : base(repository, unitOfWork, mapper, cacheService)
    {
        _numeratorService = numeratorService;
    }

    protected override Func<IQueryable<OverheadCost>, IQueryable<OverheadCost>> BuildFilter(PaginationFilter filter)
    {
        return query =>
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => (x.Code != null && x.Code.Contains(filter.Search)) ||
                                         (x.Name != null && x.Name.Contains(filter.Search)));
            }

            return query.OrderBy(x => x.Name);
        };
    }

    protected override async Task ValidateCreateAsync(CreateOverheadCostRequest request)
    {
        var code = request.Code.Trim();
        var conflictCheck = await _repository.FindAsync(x => x.Code == code);

        if (conflictCheck.Any(x => !x.IsDeleted))
            throw new BusinessException("Bu Gider Kodu aktif olarak kullanılmaktadır.");
    }

    public override async Task<Guid> CreateAsync(CreateOverheadCostRequest request)
    {
        var previewInfo = await _numeratorService.PreviewNextCodeAsync(DocumentType.OverheadCost);

        if (string.IsNullOrWhiteSpace(request.Code) || 
            request.Code.Trim() == "Yükleniyor..." || 
            request.Code.Trim() == previewInfo.NextCode)
        {
            request.Code = await _numeratorService.GenerateNextCodeAsync(DocumentType.OverheadCost);
        }

        await ValidateCreateAsync(request);
        var entity = _mapper.Map<OverheadCost>(request);
        await _repository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        await _cacheService.RemoveByPrefixAsync(CacheKey);
        return entity.Id;
    }

    protected override async Task ValidateUpdateAsync(Guid id, UpdateOverheadCostRequest request, OverheadCost entity)
    {
        var code = request.Code.Trim();
        var conflictCheck = await _repository.FindAsync(x => x.Id != id && x.Code == code);

        if (conflictCheck.Any(x => !x.IsDeleted))
            throw new BusinessException("Bu Gider Kodu başka bir kayıtta kullanılmaktadır.");
    }

    public override async Task<byte[]> ExportToExcelAsync(string reportName = "Genel Üretim Giderleri", PaginationFilter? filter = null)
    {
        var data = filter != null ? await GetFilteredDataAsync(filter) : await GetAllAsync();

        using var workbook = new ClosedXML.Excel.XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Giderler");

        if (data == null || !data.Any())
        {
            worksheet.Cell(1, 1).Value = "Veri bulunamadı.";
            using var emptyStream = new MemoryStream();
            workbook.SaveAs(emptyStream);
            return emptyStream.ToArray();
        }

        worksheet.Cell(1, 1).Value = "Gider Kodu";
        worksheet.Cell(1, 2).Value = "Gider Adı";
        worksheet.Cell(1, 3).Value = "Aylık Tutar";
        worksheet.Cell(1, 4).Value = "Para Birimi";
        worksheet.Cell(1, 5).Value = "Açıklama";
        worksheet.Cell(1, 6).Value = "Durum";

        var headerRow = worksheet.Range(1, 1, 1, 6);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.LightGray;

        int row = 2;
        foreach (var item in data)
        {
            worksheet.Cell(row, 1).Value = item.Code;
            worksheet.Cell(row, 2).Value = item.Name;
            worksheet.Cell(row, 3).Value = item.MonthlyAmount.ToString("0.####");
            worksheet.Cell(row, 4).Value = item.Currency.ToString();
            worksheet.Cell(row, 5).Value = item.Description ?? "";
            worksheet.Cell(row, 6).Value = item.IsActive ? "Aktif" : "Pasif";
            row++;
        }

        worksheet.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public override async Task<byte[]> ExportToPdfAsync(string reportName = "Genel Üretim Giderleri Raporu", PaginationFilter? filter = null)
    {
        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
        var data = filter != null ? await GetFilteredDataAsync(filter) : await GetAllAsync();

        var document = QuestPDF.Fluent.Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(QuestPDF.Helpers.PageSizes.A4.Landscape());
                page.Margin(1, QuestPDF.Infrastructure.Unit.Centimetre);
                page.PageColor(QuestPDF.Helpers.Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text(reportName).SemiBold().FontSize(20).FontColor(QuestPDF.Helpers.Colors.Blue.Darken2);
                        col.Item().Text($"Oluşturulma Tarihi: {DateTime.Now:dd.MM.yyyy HH:mm}");
                    });
                });

                page.Content().PaddingVertical(1, QuestPDF.Infrastructure.Unit.Centimetre).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        for (int i = 0; i < 6; i++) columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        string[] headers = { "Gider Kodu", "Gider Adı", "Aylık Tutar", "Para Birimi", "Açıklama", "Durum" };
                        foreach (var h in headers)
                        {
                            header.Cell().BorderBottom(2).BorderColor(QuestPDF.Helpers.Colors.Black).PaddingBottom(5).Text(h).SemiBold();
                        }
                    });

                    foreach (var item in data)
                    {
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(item.Code);
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(item.Name);
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(item.MonthlyAmount.ToString("0.####"));
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(item.Currency.ToString());
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(item.Description ?? "");
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(item.IsActive ? "Aktif" : "Pasif");
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
}
