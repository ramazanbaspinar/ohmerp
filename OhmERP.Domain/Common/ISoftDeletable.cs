namespace OhmERP.Domain.Common;

public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
}