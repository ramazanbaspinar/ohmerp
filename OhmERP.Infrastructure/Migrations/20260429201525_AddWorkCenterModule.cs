using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OhmERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkCenterModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Add new columns
            migrationBuilder.AddColumn<int>(
                name: "BatchCapacityLimit",
                table: "WorkCenters",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "WorkCenters",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "HourlyCost",
                table: "WorkCenters",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "CalculationType",
                table: "WorkCenters",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "SetupTime",
                table: "WorkCenters",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "UnitProcessTime",
                table: "WorkCenters",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "CurrencyString",
                table: "WorkCenters",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "TL");

            // 2. Data Migration
            migrationBuilder.Sql(@"
                UPDATE WorkCenters 
                SET HourlyCost = ISNULL(HourlyMachineCost, 0) + ISNULL(HourlyLaborCost, 0),
                    Category = CASE [Type] 
                        WHEN 1 THEN 'Tel Makinesi'
                        WHEN 2 THEN 'Boru Makinesi'
                        WHEN 3 THEN 'Dolum Makinesi'
                        WHEN 4 THEN 'Hadde Makinesi'
                        WHEN 5 THEN 'Büküm Makinesi'
                        WHEN 6 THEN 'Pres Makinesi'
                        WHEN 7 THEN 'Punta Makinesi'
                        WHEN 8 THEN 'Bağlantı Puntası'
                        WHEN 9 THEN 'Test Makinesi'
                        ELSE 'Diğer' END,
                    CurrencyString = CASE [Currency]
                        WHEN 1 THEN 'TL'
                        WHEN 2 THEN 'USD'
                        WHEN 3 THEN 'EUR'
                        ELSE 'TL' END,
                    CalculationType = 1 -- UnitMultiplier varsayılan
            ");

            // 3. Drop old columns
            migrationBuilder.DropColumn(name: "HourlyMachineCost", table: "WorkCenters");
            migrationBuilder.DropColumn(name: "HourlyLaborCost", table: "WorkCenters");
            migrationBuilder.DropColumn(name: "Type", table: "WorkCenters");
            migrationBuilder.DropColumn(name: "Currency", table: "WorkCenters");

            // 4. Rename CurrencyString to Currency
            migrationBuilder.RenameColumn(
                name: "CurrencyString",
                table: "WorkCenters",
                newName: "Currency");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BatchCapacityLimit",
                table: "WorkCenters");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "WorkCenters");

            migrationBuilder.DropColumn(
                name: "HourlyCost",
                table: "WorkCenters");

            migrationBuilder.RenameColumn(
                name: "UnitProcessTime",
                table: "WorkCenters",
                newName: "HourlyMachineCost");

            migrationBuilder.RenameColumn(
                name: "SetupTime",
                table: "WorkCenters",
                newName: "HourlyLaborCost");

            migrationBuilder.RenameColumn(
                name: "CalculationType",
                table: "WorkCenters",
                newName: "Type");

            migrationBuilder.AlterColumn<int>(
                name: "Currency",
                table: "WorkCenters",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(10)",
                oldMaxLength: 10);
        }
    }
}
