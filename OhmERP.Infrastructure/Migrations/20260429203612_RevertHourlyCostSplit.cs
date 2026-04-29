using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OhmERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RevertHourlyCostSplit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "HourlyCost",
                table: "WorkCenters",
                newName: "HourlyMachineCost");

            migrationBuilder.AddColumn<decimal>(
                name: "HourlyLaborCost",
                table: "WorkCenters",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HourlyLaborCost",
                table: "WorkCenters");

            migrationBuilder.RenameColumn(
                name: "HourlyMachineCost",
                table: "WorkCenters",
                newName: "HourlyCost");
        }
    }
}
