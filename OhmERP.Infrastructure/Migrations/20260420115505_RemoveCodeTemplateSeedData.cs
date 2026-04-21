using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace OhmERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCodeTemplateSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "CodeTemplates",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-e5f6-7890-abcd-ef1234567801"));

            migrationBuilder.DeleteData(
                table: "CodeTemplates",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-e5f6-7890-abcd-ef1234567802"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "CodeTemplates",
                columns: new[] { "Id", "DateFormat", "DocumentType", "IsActive", "IsManualEntryAllowed", "Padding", "Prefix", "Suffix", "UseDate" },
                values: new object[,]
                {
                    { new Guid("a1b2c3d4-e5f6-7890-abcd-ef1234567801"), "", 1, true, false, 5, "CAR", "", false },
                    { new Guid("a1b2c3d4-e5f6-7890-abcd-ef1234567802"), "", 2, true, false, 5, "MLZ", "", false }
                });
        }
    }
}
