using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OhmERP.Application.DTOs.CodeTemplate;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;
using OhmERP.Domain.Exceptions;
using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.ComponentModel.DataAnnotations;
using System.Reflection;

namespace OhmERP.Application.Services;

public class CodeTemplateService : ICodeTemplateService
{
    private readonly IGenericRepository<CodeTemplate> _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly INumeratorService _numeratorService;

    public CodeTemplateService(
        IGenericRepository<CodeTemplate> repository, 
        IUnitOfWork unitOfWork, 
        IMapper mapper,
        INumeratorService numeratorService)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _numeratorService = numeratorService;
    }

    public async Task<List<CodeTemplateDto>> GetAllAsync()
    {
        var entities = await _repository.FindWithQueryAsync(
            orderBy: q => q.OrderBy(x => x.DocumentType));

        var dtos = _mapper.Map<List<CodeTemplateDto>>(entities);
        
        foreach (var dto in dtos)
        {
            dto.CurrentNumber = await _numeratorService.GetCurrentSequenceValueAsync(dto.DocumentType);
        }

        return dtos;
    }

    public async Task UpdateAsync(Guid id, UpdateCodeTemplateRequest request)
    {
        var entity = await _repository.GetByIdAsync(id);
        
        if (entity == null)
            throw new BusinessException("Numaratör şablonu bulunamadı.");

        _mapper.Map(request, entity);
        
        if (!request.UseDate)
        {
            entity.DateFormat = null;
        }
        
        _repository.Update(entity);
        await _unitOfWork.SaveChangesAsync();

        var currentVal = await _numeratorService.GetCurrentSequenceValueAsync(entity.DocumentType);
        if (request.CurrentNumber > 0 && request.CurrentNumber != currentVal)
        {
            await _numeratorService.RestartSequenceAsync(entity.DocumentType, request.CurrentNumber);
        }
    }

    public async Task<byte[]> ExportToExcelAsync()
    {
        var data = await GetAllAsync();
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Numarator Sablonlari");
        
        var properties = typeof(CodeTemplateDto).GetProperties()
            .Where(p => p.Name != "Id" && !p.Name.EndsWith("Id"))
            .ToList();

        for (int i = 0; i < properties.Count; i++)
        {
            var prop = properties[i];
            var displayAttribute = prop.GetCustomAttribute<DisplayAttribute>();
            worksheet.Cell(1, i + 1).Value = displayAttribute?.Name ?? prop.Name;
        }

        var headerRow = worksheet.Range(1, 1, 1, properties.Count);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;

        int row = 2;
        foreach (var item in data)
        {
            for (int col = 0; col < properties.Count; col++)
            {
                var value = properties[col].GetValue(item, null);
                if (value is bool boolValue)
                {
                    worksheet.Cell(row, col + 1).Value = boolValue ? "Evet" : "Hayır";
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

    public async Task<byte[]> ExportToPdfAsync()
    {
        QuestPDF.Settings.License = LicenseType.Community;
        var data = await GetAllAsync();
        var properties = typeof(CodeTemplateDto).GetProperties()
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

                page.Header().Text("Numarator Sablonlari").SemiBold().FontSize(20);

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
                            header.Cell().BorderBottom(1).Text(displayAttribute?.Name ?? prop.Name).SemiBold();
                        }
                    });

                    foreach (var item in data)
                    {
                        foreach (var prop in properties)
                        {
                            var value = prop.GetValue(item, null);
                            string textValue = value is bool b ? (b ? "Evet" : "Hayır") : (value?.ToString() ?? string.Empty);
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(2).Text(textValue);
                        }
                    }
                });
            });
        });

        return document.GeneratePdf();
    }
}
