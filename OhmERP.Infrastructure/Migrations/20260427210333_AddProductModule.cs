using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OhmERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence<int>(
                name: "ProductCode_Seq",
                startValue: 0L);

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    FirmId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VoltParameterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WattParameterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OhmValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PipeLength = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RolledLength = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    WireId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsDoubleWound = table.Column<bool>(type: "bit", nullable: false),
                    SheetId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GasId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PinId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Plug1Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Plug2Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Socket1Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Socket1Qty = table.Column<int>(type: "int", nullable: false),
                    Socket2Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Socket2Qty = table.Column<int>(type: "int", nullable: true),
                    FlangeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    FlangeQty = table.Column<int>(type: "int", nullable: true),
                    ClampId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ClampQty = table.Column<int>(type: "int", nullable: true),
                    OmegaId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    OmegaQty = table.Column<int>(type: "int", nullable: true),
                    ConnectionSheetId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ConnectionSheetQty = table.Column<int>(type: "int", nullable: true),
                    ConnectionWireId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ConnectionWireQty = table.Column<int>(type: "int", nullable: true),
                    ConnectionWireLength = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    IsOvened = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Marking = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PackageType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SandId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsMixedSand = table.Column<bool>(type: "bit", nullable: false),
                    MixedSand1Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    MixedSand1Ratio = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    MixedSand2Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    MixedSand2Ratio = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
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
                    table.PrimaryKey("PK_Products", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Products_Company_FirmId",
                        column: x => x.FirmId,
                        principalTable: "Company",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_Items_ClampId",
                        column: x => x.ClampId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_Items_ConnectionSheetId",
                        column: x => x.ConnectionSheetId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_Items_ConnectionWireId",
                        column: x => x.ConnectionWireId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_Items_FlangeId",
                        column: x => x.FlangeId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_Items_GasId",
                        column: x => x.GasId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_Items_MixedSand1Id",
                        column: x => x.MixedSand1Id,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_Items_MixedSand2Id",
                        column: x => x.MixedSand2Id,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_Items_OmegaId",
                        column: x => x.OmegaId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_Items_PinId",
                        column: x => x.PinId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_Items_Plug1Id",
                        column: x => x.Plug1Id,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_Items_Plug2Id",
                        column: x => x.Plug2Id,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_Items_SandId",
                        column: x => x.SandId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_Items_SheetId",
                        column: x => x.SheetId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_Items_Socket1Id",
                        column: x => x.Socket1Id,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_Items_Socket2Id",
                        column: x => x.Socket2Id,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_Items_WireId",
                        column: x => x.WireId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_TechnicalParameters_VoltParameterId",
                        column: x => x.VoltParameterId,
                        principalTable: "TechnicalParameters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Products_TechnicalParameters_WattParameterId",
                        column: x => x.WattParameterId,
                        principalTable: "TechnicalParameters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProductImages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ImageBase64 = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SequenceOrder = table.Column<int>(type: "int", nullable: false),
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
                    table.PrimaryKey("PK_ProductImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductImages_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductInnerDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InnerVoltParameterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InnerWattParameterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InnerOhmValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    InnerPipeLength = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    InnerRolledLength = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    InnerWireId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InnerIsDoubleWound = table.Column<bool>(type: "bit", nullable: false),
                    InnerSheetId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InnerGasId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InnerPinId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InnerPlug1Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InnerPlug2Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    InnerSocket1Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InnerSocket1Qty = table.Column<int>(type: "int", nullable: false),
                    InnerSocket2Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    InnerSocket2Qty = table.Column<int>(type: "int", nullable: true),
                    InnerIsOvened = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InnerMarking = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InnerPackageType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InnerSandId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    InnerIsMixedSand = table.Column<bool>(type: "bit", nullable: false),
                    InnerMixedSand1Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    InnerMixedSand1Ratio = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    InnerMixedSand2Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    InnerMixedSand2Ratio = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    InnerDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
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
                    table.PrimaryKey("PK_ProductInnerDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductInnerDetails_Items_InnerGasId",
                        column: x => x.InnerGasId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductInnerDetails_Items_InnerMixedSand1Id",
                        column: x => x.InnerMixedSand1Id,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductInnerDetails_Items_InnerMixedSand2Id",
                        column: x => x.InnerMixedSand2Id,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductInnerDetails_Items_InnerPinId",
                        column: x => x.InnerPinId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductInnerDetails_Items_InnerPlug1Id",
                        column: x => x.InnerPlug1Id,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductInnerDetails_Items_InnerPlug2Id",
                        column: x => x.InnerPlug2Id,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductInnerDetails_Items_InnerSandId",
                        column: x => x.InnerSandId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductInnerDetails_Items_InnerSheetId",
                        column: x => x.InnerSheetId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductInnerDetails_Items_InnerSocket1Id",
                        column: x => x.InnerSocket1Id,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductInnerDetails_Items_InnerSocket2Id",
                        column: x => x.InnerSocket2Id,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductInnerDetails_Items_InnerWireId",
                        column: x => x.InnerWireId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductInnerDetails_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductInnerDetails_TechnicalParameters_InnerVoltParameterId",
                        column: x => x.InnerVoltParameterId,
                        principalTable: "TechnicalParameters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductInnerDetails_TechnicalParameters_InnerWattParameterId",
                        column: x => x.InnerWattParameterId,
                        principalTable: "TechnicalParameters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProductOperations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WorkCenterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SequenceOrder = table.Column<int>(type: "int", nullable: false),
                    OperationTimeMinutes = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsInnerProductRoute = table.Column<bool>(type: "bit", nullable: false),
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
                    table.PrimaryKey("PK_ProductOperations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductOperations_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductOperations_WorkCenters_WorkCenterId",
                        column: x => x.WorkCenterId,
                        principalTable: "WorkCenters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductImages_ProductId",
                table: "ProductImages",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductInnerDetails_InnerGasId",
                table: "ProductInnerDetails",
                column: "InnerGasId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductInnerDetails_InnerMixedSand1Id",
                table: "ProductInnerDetails",
                column: "InnerMixedSand1Id");

            migrationBuilder.CreateIndex(
                name: "IX_ProductInnerDetails_InnerMixedSand2Id",
                table: "ProductInnerDetails",
                column: "InnerMixedSand2Id");

            migrationBuilder.CreateIndex(
                name: "IX_ProductInnerDetails_InnerPinId",
                table: "ProductInnerDetails",
                column: "InnerPinId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductInnerDetails_InnerPlug1Id",
                table: "ProductInnerDetails",
                column: "InnerPlug1Id");

            migrationBuilder.CreateIndex(
                name: "IX_ProductInnerDetails_InnerPlug2Id",
                table: "ProductInnerDetails",
                column: "InnerPlug2Id");

            migrationBuilder.CreateIndex(
                name: "IX_ProductInnerDetails_InnerSandId",
                table: "ProductInnerDetails",
                column: "InnerSandId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductInnerDetails_InnerSheetId",
                table: "ProductInnerDetails",
                column: "InnerSheetId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductInnerDetails_InnerSocket1Id",
                table: "ProductInnerDetails",
                column: "InnerSocket1Id");

            migrationBuilder.CreateIndex(
                name: "IX_ProductInnerDetails_InnerSocket2Id",
                table: "ProductInnerDetails",
                column: "InnerSocket2Id");

            migrationBuilder.CreateIndex(
                name: "IX_ProductInnerDetails_InnerVoltParameterId",
                table: "ProductInnerDetails",
                column: "InnerVoltParameterId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductInnerDetails_InnerWattParameterId",
                table: "ProductInnerDetails",
                column: "InnerWattParameterId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductInnerDetails_InnerWireId",
                table: "ProductInnerDetails",
                column: "InnerWireId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductInnerDetails_ProductId",
                table: "ProductInnerDetails",
                column: "ProductId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductOperations_ProductId",
                table: "ProductOperations",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductOperations_WorkCenterId",
                table: "ProductOperations",
                column: "WorkCenterId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_ClampId",
                table: "Products",
                column: "ClampId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_ConnectionSheetId",
                table: "Products",
                column: "ConnectionSheetId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_ConnectionWireId",
                table: "Products",
                column: "ConnectionWireId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_FirmId",
                table: "Products",
                column: "FirmId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_FlangeId",
                table: "Products",
                column: "FlangeId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_GasId",
                table: "Products",
                column: "GasId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_MixedSand1Id",
                table: "Products",
                column: "MixedSand1Id");

            migrationBuilder.CreateIndex(
                name: "IX_Products_MixedSand2Id",
                table: "Products",
                column: "MixedSand2Id");

            migrationBuilder.CreateIndex(
                name: "IX_Products_OmegaId",
                table: "Products",
                column: "OmegaId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_PinId",
                table: "Products",
                column: "PinId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Plug1Id",
                table: "Products",
                column: "Plug1Id");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Plug2Id",
                table: "Products",
                column: "Plug2Id");

            migrationBuilder.CreateIndex(
                name: "IX_Products_SandId",
                table: "Products",
                column: "SandId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_SheetId",
                table: "Products",
                column: "SheetId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Socket1Id",
                table: "Products",
                column: "Socket1Id");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Socket2Id",
                table: "Products",
                column: "Socket2Id");

            migrationBuilder.CreateIndex(
                name: "IX_Products_VoltParameterId",
                table: "Products",
                column: "VoltParameterId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_WattParameterId",
                table: "Products",
                column: "WattParameterId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_WireId",
                table: "Products",
                column: "WireId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductImages");

            migrationBuilder.DropTable(
                name: "ProductInnerDetails");

            migrationBuilder.DropTable(
                name: "ProductOperations");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropSequence(
                name: "ProductCode_Seq");
        }
    }
}
