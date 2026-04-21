using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OhmERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCurrencyAndCategoryUOM : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "DefaultUnitOfMeasureId",
                table: "ItemCategories",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CurrencyRates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CurrencyCode = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    BuyingRate = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    SellingRate = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "varbinary(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CurrencyRates", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ItemCategories_DefaultUnitOfMeasureId",
                table: "ItemCategories",
                column: "DefaultUnitOfMeasureId");

            migrationBuilder.CreateIndex(
                name: "IX_CurrencyRates_Date_CurrencyCode",
                table: "CurrencyRates",
                columns: new[] { "Date", "CurrencyCode" },
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.AddForeignKey(
                name: "FK_ItemCategories_UnitOfMeasures_DefaultUnitOfMeasureId",
                table: "ItemCategories",
                column: "DefaultUnitOfMeasureId",
                principalTable: "UnitOfMeasures",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ItemCategories_UnitOfMeasures_DefaultUnitOfMeasureId",
                table: "ItemCategories");

            migrationBuilder.DropTable(
                name: "CurrencyRates");

            migrationBuilder.DropIndex(
                name: "IX_ItemCategories_DefaultUnitOfMeasureId",
                table: "ItemCategories");

            migrationBuilder.DropColumn(
                name: "DefaultUnitOfMeasureId",
                table: "ItemCategories");
        }
    }
}
