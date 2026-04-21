using OhmERP.Domain.Exceptions;
using AutoMapper;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.DTOs.Item;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using OhmERP.Domain.Entities;
using OhmERP.Domain.Enums;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace OhmERP.Application.Services;

public class ItemService : BaseService<Item, ItemListDto, CreateItemRequest, UpdateItemRequest>, IItemService
{
    protected override string CacheKey => "item_list_all";

    private readonly IGenericRepository<ItemCategory> _categoryRepository;
    private readonly IGenericRepository<UnitOfMeasure> _uomRepository;
    private readonly INumeratorService _numeratorService;

    public ItemService(
        IGenericRepository<Item> repository,
        IGenericRepository<ItemCategory> categoryRepository,
        IGenericRepository<UnitOfMeasure> uomRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICacheService cacheService,
        INumeratorService numeratorService)
        : base(repository, unitOfWork, mapper, cacheService)
    {
        _categoryRepository = categoryRepository;
        _uomRepository = uomRepository;
        _numeratorService = numeratorService;
    }

    public override async Task<Guid> CreateAsync(CreateItemRequest request)
    {
        var previewInfo = await _numeratorService.PreviewNextCodeAsync(DocumentType.Item);

        if (string.IsNullOrWhiteSpace(request.Code) || 
            request.Code.Trim() == "Yükleniyor..." || 
            request.Code.Trim() == previewInfo.NextCode)
        {
            request.Code = await _numeratorService.GenerateNextCodeAsync(DocumentType.Item);
        }

        await ValidateCreateAsync(request);
        var item = _mapper.Map<Item>(request);
        item.AttributeValues = new List<ItemAttributeValue>();

        if (request.DynamicAttributes != null && request.DynamicAttributes.Any())
        {
            foreach (var attr in request.DynamicAttributes)
            {
                item.AttributeValues.Add(new ItemAttributeValue
                {
                    CategoryAttributeId = attr.CategoryAttributeId,
                    StringValue = attr.StringValue,
                    DecimalValue = attr.DecimalValue
                });
            }
        }

        await _repository.AddAsync(item);
        await _unitOfWork.SaveChangesAsync();
        await _cacheService.RemoveByPrefixAsync(CacheKey);

        return item.Id;
    }

    public override async Task UpdateAsync(Guid id, UpdateItemRequest request)
    {
        await base.UpdateAsync(id, request);

        if (request.DynamicAttributes != null)
        {
            var items = await _repository.FindWithQueryAsync(query => query.Include(x => x.AttributeValues).Where(x => x.Id == id));
            var item = items.FirstOrDefault();

            if (item != null)
            {
                var incomingAttrIds = request.DynamicAttributes.Select(x => x.CategoryAttributeId).ToList();
                
                var toRemove = item.AttributeValues.Where(x => !incomingAttrIds.Contains(x.CategoryAttributeId)).ToList();
                foreach (var r in toRemove)
                {
                    item.AttributeValues.Remove(r);
                }

                foreach (var attr in request.DynamicAttributes)
                {
                    var existing = item.AttributeValues.FirstOrDefault(x => x.CategoryAttributeId == attr.CategoryAttributeId);
                    if (existing != null)
                    {
                        existing.StringValue = attr.StringValue;
                        existing.DecimalValue = attr.DecimalValue;
                    }
                    else
                    {
                        item.AttributeValues.Add(new ItemAttributeValue
                        {
                            Id = Guid.Empty,
                            ItemId = item.Id,
                            CategoryAttributeId = attr.CategoryAttributeId,
                            StringValue = attr.StringValue,
                            DecimalValue = attr.DecimalValue
                        });
                    }
                }

                _repository.Update(item);
                await _unitOfWork.SaveChangesAsync();
            }
        }
    }

    public override async Task DeleteAsync(Guid id)
    {
        var entities = await _repository.FindWithQueryAsync(query => query.Include(x => x.AttributeValues).Where(x => x.Id == id));
        var item = entities.FirstOrDefault();
        
        if (item == null) throw new BusinessException("Malzeme bulunamadı.");
        if (item.IsDeleted) throw new BusinessException("Malzeme zaten silinmiş.");

        if (item.AttributeValues != null)
        {
            foreach (var attr in item.AttributeValues)
            {
                attr.IsDeleted = true;
            }
        }

        _repository.Remove(item);
        await _unitOfWork.SaveChangesAsync();
        await _cacheService.RemoveByPrefixAsync(CacheKey);
    }

    protected override Func<IQueryable<Item>, IQueryable<Item>> BuildFilter(PaginationFilter filter)
    {
        return query =>
        {
            query = query.Include(x => x.Category).Include(x => x.UnitOfMeasure).Include(x => x.AttributeValues);

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
                query = query.Where(x => (int)x.Type == filter.Type.Value);
            }

            if (filter.CategoryId.HasValue)
            {
                query = query.Where(x => x.CategoryId == filter.CategoryId.Value);
            }

            return query;
        };
    }

    public async Task<UpdateItemRequest> GetForUpdateAsync(Guid id)
    {
        var entities = await _repository.FindWithQueryAsync(query => query.Include(x => x.AttributeValues).Where(x => x.Id == id));
        var entity = entities.FirstOrDefault();
            
        if (entity == null || entity.IsDeleted)
            throw new BusinessException("Malzeme bulunamadı.");

        var request = _mapper.Map<UpdateItemRequest>(entity);
        
        if (entity.AttributeValues != null && entity.AttributeValues.Any())
        {
            request.DynamicAttributes = entity.AttributeValues.Select(x => new OhmERP.Application.DTOs.ItemAttributeValue.ItemAttributeValueDto
            {
                Id = x.Id,
                CategoryAttributeId = x.CategoryAttributeId,
                StringValue = x.StringValue,
                DecimalValue = x.DecimalValue
            }).ToList();
        }

        return request;
    }

    protected override async Task ValidateCreateAsync(CreateItemRequest request)
    {
        if (await _repository.AnyAsync(x => x.Code == request.Code.Trim() && !x.IsDeleted))
            throw new BusinessException("Girilen sistem kodu zaten başka bir kayıtta kullanılmaktadır. Lütfen farklı bir kod giriniz.");
    }

    protected override async Task ValidateUpdateAsync(Guid id, UpdateItemRequest request, Item entity)
    {
        if (await _repository.AnyAsync(x => x.Code == request.Code.Trim() && x.Id != id && !x.IsDeleted))
            throw new BusinessException("Girilen sistem kodu zaten başka bir kayıtta kullanılmaktadır. Lütfen farklı bir kod giriniz.");
    }

    public override async Task<byte[]> ExportToExcelAsync(string reportName = "Dışa Aktarım", PaginationFilter? filter = null)
    {
        if (filter?.CategoryId.HasValue == true)
        {
            var category = await _categoryRepository.GetByIdAsync(filter.CategoryId.Value);
            if (category != null && category.Code == "TEL")
            {
                return await ExportTelToExcelAsync(filter);
            }
            if (category != null && category.Code == "SAC")
            {
                return await ExportSacToExcelAsync(filter);
            }
        }
        return await base.ExportToExcelAsync(reportName, filter);
    }

    public override async Task<byte[]> ExportToPdfAsync(string reportName = "Sistem Çıktısı", PaginationFilter? filter = null)
    {
        if (filter?.CategoryId.HasValue == true)
        {
            var category = await _categoryRepository.GetByIdAsync(filter.CategoryId.Value);
            if (category != null && category.Code == "TEL")
            {
                return await ExportTelToPdfAsync(filter);
            }
            if (category != null && category.Code == "SAC")
            {
                return await ExportSacToPdfAsync(filter);
            }
        }
        return await base.ExportToPdfAsync(reportName, filter);
    }

    private async Task<byte[]> ExportTelToExcelAsync(PaginationFilter filter)
    {
        var filterFunc = BuildFilter(filter);
        var entities = await _repository.FindWithQueryAsync(q => filterFunc(q.Where(x => !x.IsDeleted)).OrderByDescending(x => x.CreatedDate));

        using var workbook = new ClosedXML.Excel.XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Tel Tanımları");

        var headers = new[] { "Kodu", "Adı", "Çap", "Ağırlık", "Ohm", "Birim Maliyet", "Para Birimi", "Kritik Stok Seviyesi (KG)", "Durum" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
        }

        var headerRow = worksheet.Range(1, 1, 1, headers.Length);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.LightGray;
        headerRow.Style.Border.BottomBorder = ClosedXML.Excel.XLBorderStyleValues.Thin;

        int row = 2;
        foreach (var item in entities)
        {
            decimal cap = 0, agirlik = 0, ohm = 0;
            if (!string.IsNullOrEmpty(item.PropertiesJson))
            {
                try
                {
                    var props = System.Text.Json.JsonSerializer.Deserialize<System.Collections.Generic.Dictionary<string, decimal>>(item.PropertiesJson);
                    if (props != null)
                    {
                        if (props.TryGetValue("Cap", out var c)) cap = c;
                        if (props.TryGetValue("Agirlik", out var a)) agirlik = a;
                        if (props.TryGetValue("Ohm", out var o)) ohm = o;
                    }
                }
                catch { }
            }

            worksheet.Cell(row, 1).Value = item.Code;
            worksheet.Cell(row, 2).Value = item.Name;
            worksheet.Cell(row, 3).Value = cap;
            worksheet.Cell(row, 4).Value = agirlik;
            worksheet.Cell(row, 5).Value = ohm;
            worksheet.Cell(row, 6).Value = item.UnitCost;
            worksheet.Cell(row, 7).Value = item.CostCurrency.ToString();
            worksheet.Cell(row, 8).Value = item.CriticalStockLevel;
            worksheet.Cell(row, 9).Value = item.IsActive ? "Aktif" : "Pasif";
            row++;
        }

        worksheet.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private async Task<byte[]> ExportTelToPdfAsync(PaginationFilter filter)
    {
        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
        var filterFunc = BuildFilter(filter);
        var entities = await _repository.FindWithQueryAsync(q => filterFunc(q.Where(x => !x.IsDeleted)).OrderByDescending(x => x.CreatedDate));

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
                        col.Item().Text("Tel Tanımları Listesi").SemiBold().FontSize(20).FontColor(QuestPDF.Helpers.Colors.Blue.Darken2);
                        col.Item().Text($"Oluşturulma Tarihi: {DateTime.Now:dd.MM.yyyy HH:mm}");
                    });
                });

                page.Content().PaddingVertical(1, QuestPDF.Infrastructure.Unit.Centimetre).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        for (int i = 0; i < 9; i++) columns.RelativeColumn();
                    });

                    var headers = new[] { "Kodu", "Adı", "Çap", "Ağırlık", "Ohm", "Birim Maliyet", "Para Birimi", "Kritik Stok Seviyesi (KG)", "Durum" };
                    table.Header(header =>
                    {
                        foreach (var headerName in headers)
                        {
                            header.Cell().BorderBottom(2).BorderColor(QuestPDF.Helpers.Colors.Black).PaddingBottom(5).Text(headerName).SemiBold();
                        }
                    });

                    foreach (var item in entities)
                    {
                        decimal cap = 0, agirlik = 0, ohm = 0;
                        if (!string.IsNullOrEmpty(item.PropertiesJson))
                        {
                            try
                            {
                                var props = System.Text.Json.JsonSerializer.Deserialize<System.Collections.Generic.Dictionary<string, decimal>>(item.PropertiesJson);
                                if (props != null)
                                {
                                    if (props.TryGetValue("Cap", out var c)) cap = c;
                                    if (props.TryGetValue("Agirlik", out var a)) agirlik = a;
                                    if (props.TryGetValue("Ohm", out var o)) ohm = o;
                                }
                            }
                            catch { }
                        }

                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(item.Code);
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(item.Name);
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(cap.ToString());
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(agirlik.ToString());
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(ohm.ToString());
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(item.UnitCost.ToString());
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(item.CostCurrency.ToString());
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(item.CriticalStockLevel.ToString());
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

    private async Task<byte[]> ExportSacToExcelAsync(PaginationFilter filter)
    {
        var filterFunc = BuildFilter(filter);
        var entities = await _repository.FindWithQueryAsync(q => filterFunc(q.Where(x => !x.IsDeleted)).OrderByDescending(x => x.CreatedDate));

        using var workbook = new ClosedXML.Excel.XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Sac Tanımları");

        var headers = new[] { "Kodu", "Adı", "Sac Kalınlığı (mm)", "Sac Eni (mm)", "Yoğunluk", "Kritik Stok Seviyesi (KG)", "Durum" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
        }

        var headerRow = worksheet.Range(1, 1, 1, headers.Length);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.LightGray;
        headerRow.Style.Border.BottomBorder = ClosedXML.Excel.XLBorderStyleValues.Thin;

        int row = 2;
        foreach (var item in entities)
        {
            decimal kalinlik = 0, en = 0, yogunluk = 0;
            if (!string.IsNullOrEmpty(item.PropertiesJson))
            {
                try
                {
                    var props = System.Text.Json.JsonSerializer.Deserialize<System.Collections.Generic.Dictionary<string, decimal>>(item.PropertiesJson);
                    if (props != null)
                    {
                        if (props.TryGetValue("Kalinlik", out var k)) kalinlik = k;
                        else if (props.TryGetValue("kalinlik", out var k2)) kalinlik = k2;
                        if (props.TryGetValue("En", out var e)) en = e;
                        else if (props.TryGetValue("en", out var e2)) en = e2;
                        if (props.TryGetValue("Yogunluk", out var y)) yogunluk = y;
                        else if (props.TryGetValue("yogunluk", out var y2)) yogunluk = y2;
                    }
                }
                catch { }
            }

            worksheet.Cell(row, 1).Value = item.Code;
            worksheet.Cell(row, 2).Value = item.Name;
            worksheet.Cell(row, 3).Value = kalinlik;
            worksheet.Cell(row, 4).Value = en;
            worksheet.Cell(row, 5).Value = yogunluk;
            worksheet.Cell(row, 6).Value = item.CriticalStockLevel;
            worksheet.Cell(row, 7).Value = item.IsActive ? "Aktif" : "Pasif";
            row++;
        }

        worksheet.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private async Task<byte[]> ExportSacToPdfAsync(PaginationFilter filter)
    {
        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
        var filterFunc = BuildFilter(filter);
        var entities = await _repository.FindWithQueryAsync(q => filterFunc(q.Where(x => !x.IsDeleted)).OrderByDescending(x => x.CreatedDate));

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
                        col.Item().Text("Sac Tanımları Listesi").SemiBold().FontSize(20).FontColor(QuestPDF.Helpers.Colors.Blue.Darken2);
                        col.Item().Text($"Oluşturulma Tarihi: {DateTime.Now:dd.MM.yyyy HH:mm}");
                    });
                });

                page.Content().PaddingVertical(1, QuestPDF.Infrastructure.Unit.Centimetre).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        for (int i = 0; i < 7; i++) columns.RelativeColumn();
                    });

                    var headers = new[] { "Kodu", "Adı", "Sac Kalınlığı (mm)", "Sac Eni (mm)", "Yoğunluk", "Kritik Stok Seviyesi (KG)", "Durum" };
                    table.Header(header =>
                    {
                        foreach (var headerName in headers)
                        {
                            header.Cell().BorderBottom(2).BorderColor(QuestPDF.Helpers.Colors.Black).PaddingBottom(5).Text(headerName).SemiBold();
                        }
                    });

                    foreach (var item in entities)
                    {
                        decimal kalinlik = 0, en = 0, yogunluk = 0;
                        if (!string.IsNullOrEmpty(item.PropertiesJson))
                        {
                            try
                            {
                                var props = System.Text.Json.JsonSerializer.Deserialize<System.Collections.Generic.Dictionary<string, decimal>>(item.PropertiesJson);
                                if (props != null)
                                {
                                    if (props.TryGetValue("Kalinlik", out var k)) kalinlik = k;
                                    else if (props.TryGetValue("kalinlik", out var k2)) kalinlik = k2;
                                    if (props.TryGetValue("En", out var e)) en = e;
                                    else if (props.TryGetValue("en", out var e2)) en = e2;
                                    if (props.TryGetValue("Yogunluk", out var y)) yogunluk = y;
                                    else if (props.TryGetValue("yogunluk", out var y2)) yogunluk = y2;
                                }
                            }
                            catch { }
                        }

                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(item.Code);
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(item.Name);
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(kalinlik.ToString());
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(en.ToString());
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(yogunluk.ToString());
                        table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingVertical(5).Text(item.CriticalStockLevel.ToString());
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
