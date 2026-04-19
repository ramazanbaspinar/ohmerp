using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.Role;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Constants;
using OhmERP.WebApi.Security;
using System.Security.Claims;
using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace OhmERP.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RoleController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RoleController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet]
    [HasPermission(Permissions.Roles.View)]
    public async Task<IActionResult> GetRoles([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] bool? isActive = null)
    {
        var result = await _roleService.GetRolesAsync(page, pageSize, search, isActive);
        return Ok(result);
    }

    [HttpGet("lookup")]
    public async Task<IActionResult> GetRoleLookup()
    {
        var lookup = await _roleService.GetRoleLookupAsync();
        return Ok(lookup);
    }

    [HttpPost]
    [HasPermission(Permissions.Roles.Create)]
    public async Task<IActionResult> CreateRole([FromBody] RoleDto request)
    {
        try
        {
            await _roleService.CreateRoleAsync(request);
            return Ok(new { message = "Rol başarıyla oluşturuldu/kurtarıldı." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [HasPermission(Permissions.Roles.Edit)]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] RoleDto request)
    {
        try
        {
            await _roleService.UpdateRoleAsync(id, request);
            return Ok(new { message = "Rol başarıyla güncellendi." });
        }
        catch (Exception ex)
        {
            if (ex.Message.Contains("bulunamadı")) return NotFound(new { message = ex.Message });
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id}/toggle-status")]
    [HasPermission(Permissions.Roles.Edit)]
    public async Task<IActionResult> ToggleRoleStatus(Guid id)
    {
        try
        {
            await _roleService.ToggleRoleStatusAsync(id);
            return Ok(new { message = "Rol durumu başarıyla güncellendi." });
        }
        catch (Exception ex)
        {
            if (ex.Message.Contains("bulunamadı")) return NotFound(new { message = ex.Message });
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [HasPermission(Permissions.Roles.Delete)]
    public async Task<IActionResult> DeleteRole(Guid id)
    {
        try
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _roleService.DeleteRoleAsync(id, userIdString);
            return Ok(new { message = "Rol sistemden kalıcı olarak silindi." });
        }
        catch (Exception ex)
        {
            if (ex.Message.Contains("bulunamadı")) return NotFound(new { message = ex.Message });
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id}/permissions")]
    [HasPermission(Permissions.Roles.View)]
    public async Task<IActionResult> GetRolePermissions(Guid id)
    {
        var permissions = await _roleService.GetRolePermissionsAsync(id);
        return Ok(permissions);
    }

    [HttpPost("{id}/permissions")]
    [HasPermission(Permissions.Roles.AssignPermissions)]
    public async Task<IActionResult> AssignPermissions(Guid id, [FromBody] List<string> permissionCodes)
    {
        await _roleService.AssignPermissionsToRoleAsync(id, permissionCodes);
        return Ok(new { message = "Yetkiler başarıyla güncellendi." });
    }

    [HttpGet("export/excel")]
    [HasPermission(Permissions.Roles.View)]
    public async Task<IActionResult> ExportToExcel([FromQuery] string? search, [FromQuery] bool? isActive)
    {
        var data = await _roleService.GetAllRolesForExportAsync(search, isActive);

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Roller");
        worksheet.Cell(1, 1).Value = "Rol Kodu";
        worksheet.Cell(1, 2).Value = "Rol Adı";
        worksheet.Cell(1, 3).Value = "Açıklama";
        worksheet.Cell(1, 4).Value = "Durum";

        var headerRow = worksheet.Range(1, 1, 1, 4);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;

        int row = 2;
        foreach (var item in data)
        {
            worksheet.Cell(row, 1).Value = item.Code;
            worksheet.Cell(row, 2).Value = item.Name;
            worksheet.Cell(row, 3).Value = item.Description;
            worksheet.Cell(row, 4).Value = item.IsActive ? "Aktif" : "Pasif";
            row++;
        }

        worksheet.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Roller_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
    }

    [HttpGet("export/pdf")]
    [HasPermission(Permissions.Roles.View)]
    public async Task<IActionResult> ExportToPdf([FromQuery] string? search, [FromQuery] bool? isActive)
    {
        QuestPDF.Settings.License = LicenseType.Community;
        var data = await _roleService.GetAllRolesForExportAsync(search, isActive);

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
                        col.Item().Text("Roller Listesi").SemiBold().FontSize(20).FontColor(Colors.Blue.Darken2);
                        col.Item().Text($"Oluşturulma Tarihi: {DateTime.Now:dd.MM.yyyy HH:mm}");
                    });
                });

                page.Content().PaddingVertical(1, Unit.Centimetre).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(3);
                        columns.RelativeColumn(4);
                        columns.RelativeColumn(2);
                    });

                    table.Header(header =>
                    {
                        header.Cell().BorderBottom(2).BorderColor(Colors.Black).PaddingBottom(5).Text("Rol Kodu").SemiBold();
                        header.Cell().BorderBottom(2).BorderColor(Colors.Black).PaddingBottom(5).Text("Rol Adı").SemiBold();
                        header.Cell().BorderBottom(2).BorderColor(Colors.Black).PaddingBottom(5).Text("Açıklama").SemiBold();
                        header.Cell().BorderBottom(2).BorderColor(Colors.Black).PaddingBottom(5).Text("Durum").SemiBold();
                    });

                    foreach (var item in data)
                    {
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5).Text(item.Code);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5).Text(item.Name);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5).Text(item.Description ?? "");
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5).Text(item.IsActive ? "Aktif" : "Pasif");
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

        return File(document.GeneratePdf(), "application/pdf", $"Roller_{DateTime.Now:yyyyMMdd_HHmm}.pdf");
    }
}