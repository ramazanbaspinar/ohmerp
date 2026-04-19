using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.Auth;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Constants;
using OhmERP.Domain.Entities;
using OhmERP.WebApi.Security;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Security.Cryptography;
using System.Text;

namespace OhmERP.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    [HasPermission(Permissions.Users.View)]
    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var pagedUsers = await _userService.GetAllUsersWithRolesAsync(page, pageSize);
        return Ok(pagedUsers);
    }

    [HttpPost]
    [HasPermission(Permissions.Users.Create)]
    public async Task<IActionResult> CreateUser([FromBody] RegisterRequest request)
    {
        try
        {
            await _userService.CreateUserAsync(request);
            return Ok(new { message = "Personel başarıyla sisteme kaydedildi." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [HasPermission(Permissions.Users.Edit)]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
    {
        try
        {
            await _userService.UpdateUserAsync(id, request);
            return Ok(new { message = "Personel bilgileri başarıyla güncellendi." });
        }
        catch (Exception ex)
        {
            if (ex.Message == "Güncellenecek kullanıcı bulunamadı.") return NotFound(new { message = ex.Message });
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [HasPermission(Permissions.Users.Delete)]
    public async Task<IActionResult> ToggleUserStatus(Guid id)
    {
        try
        {
            await _userService.ToggleUserStatusAsync(id);
            return Ok(new { message = "Kullanıcı durumu güncellendi." });
        }
        catch (Exception ex)
        {
            if (ex.Message == "Kullanıcı bulunamadı.") return NotFound(new { message = ex.Message });
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("export/excel")]
    public async Task<IActionResult> ExportToExcel()
    {
        var data = await _userService.GetAllUsersWithRolesAsync(1, 10000);

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Sistem Kullanıcıları");

        worksheet.Cell(1, 1).Value = "Ad";
        worksheet.Cell(1, 2).Value = "Soyad";
        worksheet.Cell(1, 3).Value = "E-Posta";
        worksheet.Cell(1, 4).Value = "Departman";
        worksheet.Cell(1, 5).Value = "Durum";

        var headerRow = worksheet.Range(1, 1, 1, 5);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;

        int row = 2;
        foreach (var item in data.Items)
        {
            worksheet.Cell(row, 1).Value = item.FirstName;
            worksheet.Cell(row, 2).Value = item.LastName;
            worksheet.Cell(row, 3).Value = item.Email;
            worksheet.Cell(row, 4).Value = item.Role;
            worksheet.Cell(row, 5).Value = item.IsActive ? "Aktif" : "Pasif";
            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Kullanicilar_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
    }

    [HttpGet("export/pdf")]
    public async Task<IActionResult> ExportToPdf()
    {
        QuestPDF.Settings.License = LicenseType.Community;
        var data = await _userService.GetAllUsersWithRolesAsync(1, 10000);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(1, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                page.Header().Row(r =>
                {
                    r.RelativeItem().Column(col =>
                    {
                        col.Item().Text("Sistem Kullanıcıları Listesi").SemiBold().FontSize(20).FontColor(Colors.Blue.Darken2);
                        col.Item().Text($"Oluşturulma Tarihi: {DateTime.Now:dd.MM.yyyy HH:mm}");
                    });
                });

                page.Content().PaddingVertical(1, Unit.Centimetre).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        var headers = new[] { "Ad", "Soyad", "E-Posta", "Departman", "Durum" };
                        foreach (var title in headers)
                        {
                            header.Cell().BorderBottom(2).BorderColor(Colors.Black).PaddingBottom(5).Text(title).SemiBold();
                        }
                    });

                    foreach (var item in data.Items)
                    {
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5).Text(item.FirstName);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5).Text(item.LastName);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5).Text(item.Email);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5).Text(item.Role);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5).Text(item.IsActive ? "Aktif" : "Pasif");
                    }
                });

                page.Footer().AlignCenter().Text(x => { x.Span("Sayfa "); x.CurrentPageNumber(); x.Span(" / "); x.TotalPages(); });
            });
        });

        return File(document.GeneratePdf(), "application/pdf", $"Kullanicilar_{DateTime.Now:yyyyMMdd_HHmm}.pdf");
    }

    private void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
    {
        using (var hmac = new HMACSHA512())
        {
            passwordSalt = hmac.Key;
            passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        }
    }
}