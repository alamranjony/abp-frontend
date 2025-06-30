using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class ShopIntegrationFromWebService : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "TimeZone",
                table: "AppStore",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "AppStore",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "AppCommissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PickupOrderAboveLimit = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PickupOrderBelowLimit = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OutgoingWireOrderBonusOver100Order = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppCommissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppWireServiceShop",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Account = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    HeadquarterCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    UserId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Password = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    MemberCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    InterfaceId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ApiUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CrossRefShopCode = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    FloristAuthShopCode = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    WireServiceId = table.Column<int>(type: "int", nullable: false),
                    IsAutoForward = table.Column<bool>(type: "bit", nullable: true),
                    IsConfirmReqd = table.Column<bool>(type: "bit", nullable: true),
                    IsDefault = table.Column<bool>(type: "bit", nullable: true),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppWireServiceShop", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppCommissionOnLocalOrders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CommissionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LocalOrderMinValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    LocalOrderMaxValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PayoutAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppCommissionOnLocalOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppCommissionOnLocalOrders_AppCommissions_CommissionId",
                        column: x => x.CommissionId,
                        principalTable: "AppCommissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AppCommissionOnWireOrders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CommissionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WireOrderMinValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    WireOrderMaxValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Commission = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppCommissionOnWireOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppCommissionOnWireOrders_AppCommissions_CommissionId",
                        column: x => x.CommissionId,
                        principalTable: "AppCommissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppCommissionOnLocalOrders_CommissionId",
                table: "AppCommissionOnLocalOrders",
                column: "CommissionId");

            migrationBuilder.CreateIndex(
                name: "IX_AppCommissionOnWireOrders_CommissionId",
                table: "AppCommissionOnWireOrders",
                column: "CommissionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppCommissionOnLocalOrders");

            migrationBuilder.DropTable(
                name: "AppCommissionOnWireOrders");

            migrationBuilder.DropTable(
                name: "AppWireServiceShop");

            migrationBuilder.DropTable(
                name: "AppCommissions");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "AppStore");

            migrationBuilder.AlterColumn<int>(
                name: "TimeZone",
                table: "AppStore",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);
        }
    }
}
