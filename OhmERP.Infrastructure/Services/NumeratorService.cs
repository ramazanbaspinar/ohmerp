using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;
using OhmERP.Domain.Enums;
using OhmERP.Infrastructure.Contexts;

namespace OhmERP.Infrastructure.Services;

public class NumeratorService : INumeratorService
{
    private readonly OhmERPDbContext _context;

    private static readonly Dictionary<DocumentType, string> _sequenceMap = new()
    {
        { DocumentType.Company, "CompanyCode_Seq" },
        { DocumentType.Item,    "ItemCode_Seq" },
        { DocumentType.WorkCenter, "WorkCenterCode_Seq" },
        { DocumentType.OverheadCost, "OverheadCostCode_Seq" },
        { DocumentType.TechnicalParameter, "TechnicalParameterCode_Seq" },
        { DocumentType.Product, "ProductCode_Seq" }
    };

    private static readonly Dictionary<DocumentType, CodeTemplate> _defaultTemplates = new()
    {
        { DocumentType.Company, new CodeTemplate { DocumentType = DocumentType.Company, Prefix = "CAR", Suffix = "", Padding = 5, UseDate = false, DateFormat = "", IsActive = true, IsManualEntryAllowed = false } },
        { DocumentType.Item,    new CodeTemplate { DocumentType = DocumentType.Item,    Prefix = "MLZ", Suffix = "", Padding = 5, UseDate = false, DateFormat = "", IsActive = true, IsManualEntryAllowed = false } },
        { DocumentType.WorkCenter, new CodeTemplate { DocumentType = DocumentType.WorkCenter, Prefix = "MAK", Suffix = "", Padding = 5, UseDate = false, DateFormat = "", IsActive = true, IsManualEntryAllowed = false } },
        { DocumentType.OverheadCost, new CodeTemplate { DocumentType = DocumentType.OverheadCost, Prefix = "GDR", Suffix = "", Padding = 5, UseDate = false, DateFormat = "", IsActive = true, IsManualEntryAllowed = false } },
        { DocumentType.TechnicalParameter, new CodeTemplate { DocumentType = DocumentType.TechnicalParameter, Prefix = "PRM", Suffix = "", Padding = 5, UseDate = false, DateFormat = "", IsActive = true, IsManualEntryAllowed = false } },
        { DocumentType.Product, new CodeTemplate { DocumentType = DocumentType.Product, Prefix = "URN", Suffix = "", Padding = 5, UseDate = false, DateFormat = "", IsActive = true, IsManualEntryAllowed = false } }
    };

    public NumeratorService(OhmERPDbContext context)
    {
        _context = context;
    }

    public async Task<string> GenerateNextCodeAsync(DocumentType type)
    {
        var template = await _context.CodeTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.DocumentType == type && t.IsActive);

        if (template == null)
        {
            var fallbackTemplate = _defaultTemplates.TryGetValue(type, out var defaultTpl)
                ? defaultTpl
                : new CodeTemplate { Prefix = type.ToString().ToUpper()[..3], Padding = 5, UseDate = false, IsManualEntryAllowed = false };

            template = new CodeTemplate
            {
                Id = Guid.NewGuid(),
                DocumentType = type,
                Prefix = fallbackTemplate.Prefix,
                Suffix = fallbackTemplate.Suffix,
                Padding = fallbackTemplate.Padding,
                UseDate = fallbackTemplate.UseDate,
                DateFormat = fallbackTemplate.DateFormat,
                IsActive = true,
                IsManualEntryAllowed = fallbackTemplate.IsManualEntryAllowed
            };

            _context.CodeTemplates.Add(template);
            await _context.SaveChangesAsync();
        }

        if (!_sequenceMap.TryGetValue(type, out var sequenceName))
            throw new ArgumentException($"Tanımsız belge tipi için sequence bulunamadı: {type}");

        var connection = _context.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
            await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = $"SELECT NEXT VALUE FOR {sequenceName}";

        if (_context.Database.CurrentTransaction != null)
            command.Transaction = _context.Database.CurrentTransaction.GetDbTransaction();

        var result = await command.ExecuteScalarAsync();
        var sequenceNumber = Convert.ToInt32(result);

        if (sequenceNumber == 0)
        {
            command.CommandText = $"SELECT NEXT VALUE FOR {sequenceName}";
            if (_context.Database.CurrentTransaction != null)
                command.Transaction = _context.Database.CurrentTransaction.GetDbTransaction();
            result = await command.ExecuteScalarAsync();
            sequenceNumber = Convert.ToInt32(result);
        }

        return BuildCode(template, sequenceNumber);
    }

    public async Task<(string NextCode, bool IsManualEntryAllowed)> PreviewNextCodeAsync(DocumentType type)
    {
        var template = await _context.CodeTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.DocumentType == type && t.IsActive);

        if (template == null)
        {
            var fallbackTemplate = _defaultTemplates.TryGetValue(type, out var defaultTpl)
                ? defaultTpl
                : new CodeTemplate { Prefix = type.ToString().ToUpper()[..3], Padding = 5, UseDate = false, IsManualEntryAllowed = false };

            template = new CodeTemplate
            {
                Id = Guid.NewGuid(),
                DocumentType = type,
                Prefix = fallbackTemplate.Prefix,
                Suffix = fallbackTemplate.Suffix,
                Padding = fallbackTemplate.Padding,
                UseDate = fallbackTemplate.UseDate,
                DateFormat = fallbackTemplate.DateFormat,
                IsActive = true,
                IsManualEntryAllowed = fallbackTemplate.IsManualEntryAllowed
            };

            _context.CodeTemplates.Add(template);
            await _context.SaveChangesAsync();
        }

        if (!_sequenceMap.TryGetValue(type, out var sequenceName))
            throw new ArgumentException($"Tanımsız belge tipi için sequence bulunamadı: {type}");

        var connection = _context.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
            await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = $"SELECT CAST(ISNULL(current_value, start_value) AS INT) + CASE WHEN current_value IS NULL THEN 0 ELSE CAST(increment AS INT) END FROM sys.sequences WHERE name = '{sequenceName}'";

        if (_context.Database.CurrentTransaction != null)
            command.Transaction = _context.Database.CurrentTransaction.GetDbTransaction();

        var result = await command.ExecuteScalarAsync();
        var sequenceNumber = result != DBNull.Value && result != null ? Convert.ToInt32(result) : 0;
        if (sequenceNumber == 0) sequenceNumber = 1;

        var previewCode = BuildCode(template, sequenceNumber);
        return (previewCode, template.IsManualEntryAllowed);
    }

    public async Task<int> GetCurrentSequenceValueAsync(DocumentType type)
    {
        if (!_sequenceMap.TryGetValue(type, out var sequenceName))
            throw new ArgumentException($"Tanımsız belge tipi için sequence bulunamadı: {type}");

        var connection = _context.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
            await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = $"SELECT CAST(ISNULL(current_value, start_value) AS INT) FROM sys.sequences WHERE name = '{sequenceName}'";
        
        var result = await command.ExecuteScalarAsync();
        return result != DBNull.Value && result != null ? Convert.ToInt32(result) : 0;
    }

    public async Task RestartSequenceAsync(DocumentType type, int newStartValue)
    {
        if (!_sequenceMap.TryGetValue(type, out var sequenceName))
            throw new ArgumentException($"Tanımsız belge tipi için sequence bulunamadı: {type}");

        var sql = $"ALTER SEQUENCE {sequenceName} RESTART WITH {newStartValue};";
        await _context.Database.ExecuteSqlRawAsync(sql);
    }

    private static string BuildCode(CodeTemplate template, int sequenceNumber)
    {
        var parts = new List<string>();

        if (!string.IsNullOrWhiteSpace(template.Prefix))
            parts.Add(template.Prefix);

        if (template.UseDate && !string.IsNullOrWhiteSpace(template.DateFormat))
            parts.Add(DateTime.Now.ToString(template.DateFormat));

        parts.Add(sequenceNumber.ToString($"D{template.Padding}"));

        if (!string.IsNullOrWhiteSpace(template.Suffix))
            parts.Add(template.Suffix);

        return string.Join("-", parts);
    }
}
