using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OhmERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RefactorImageStorage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageBase64",
                table: "ProductImages");

            migrationBuilder.AddColumn<string>(
                name: "ImagePath",
                table: "ProductImages",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagePath",
                table: "ProductImages");

            migrationBuilder.AddColumn<string>(
                name: "ImageBase64",
                table: "ProductImages",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
