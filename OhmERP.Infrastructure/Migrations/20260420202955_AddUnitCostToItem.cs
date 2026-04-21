using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OhmERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUnitCostToItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CostCurrency",
                table: "Items",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "UnitCost",
                table: "Items",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CostCurrency",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "UnitCost",
                table: "Items");
        }
    }
}
