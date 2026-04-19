namespace OhmERP.Application.DTOs.Common;

public class PaginationFilter
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Search { get; set; }
    public bool? IsActive { get; set; }
    public int? Type { get; set; }
    public Guid? CityId { get; set; }
}
