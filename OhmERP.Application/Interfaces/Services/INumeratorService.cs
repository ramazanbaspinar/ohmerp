using OhmERP.Domain.Enums;

namespace OhmERP.Application.Interfaces.Services;

public interface INumeratorService
{
    Task<string> GenerateNextCodeAsync(DocumentType type);
    Task<(string NextCode, bool IsManualEntryAllowed)> PreviewNextCodeAsync(DocumentType type);
    Task<int> GetCurrentSequenceValueAsync(DocumentType type);
    Task RestartSequenceAsync(DocumentType type, int newStartValue);
}
