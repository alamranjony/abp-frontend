using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class AddPrinterSetups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppComputers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PrintNodeId = table.Column<long>(type: "bigint", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Inet = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Inet6 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HostName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Jre = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreateTimestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    State = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Version = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppComputers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppUnapprovedCreditCardOrders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StoreId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUnapprovedCreditCardOrders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppPrinters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PrintNodeId = table.Column<long>(type: "bigint", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Default = table.Column<bool>(type: "bit", nullable: true),
                    CreateTimeStamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    State = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ComputerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    Capabilities = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppPrinters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppPrinters_AppComputers_ComputerId",
                        column: x => x.ComputerId,
                        principalTable: "AppComputers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AppPrinterSetups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PrintJobType = table.Column<int>(type: "int", nullable: false),
                    OrderPrinterId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    OrderTray = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ThreePanelCardPrinterId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ThreePanelCardTray = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FourPanelCardPrinterId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    FourPanelCardTray = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AllInOneCardPrinterId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AllInOneCardTray = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StoreId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PrinterId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppPrinterSetups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppPrinterSetups_AppPrinters_PrinterId",
                        column: x => x.PrinterId,
                        principalTable: "AppPrinters",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppPrinters_ComputerId",
                table: "AppPrinters",
                column: "ComputerId");

            migrationBuilder.CreateIndex(
                name: "IX_AppPrinterSetups_PrinterId",
                table: "AppPrinterSetups",
                column: "PrinterId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppPrinterSetups");

            migrationBuilder.DropTable(
                name: "AppUnapprovedCreditCardOrders");

            migrationBuilder.DropTable(
                name: "AppPrinters");

            migrationBuilder.DropTable(
                name: "AppComputers");
        }
    }
}
