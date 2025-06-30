using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class UAT22 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmployeeId",
                table: "AppDriverStatusTrackers");

            migrationBuilder.DropColumn(
                name: "LastTripId",
                table: "AppDriverStatusTrackers");

            migrationBuilder.DropColumn(
                name: "WireServiceId",
                table: "AppDeliveryDetails");

            migrationBuilder.RenameColumn(
                name: "CheckOutDateTime",
                table: "AppTrips",
                newName: "CheckedOutAt");

            migrationBuilder.RenameColumn(
                name: "CheckInDateTime",
                table: "AppTrips",
                newName: "CheckedInAt");

            migrationBuilder.AddColumn<long>(
                name: "OrderCount",
                table: "AppWireServiceAllocationSettings",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<decimal>(
                name: "ProductMinPrice",
                table: "AppShopProducts",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "AdditionalComment",
                table: "AppOrders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CanceledDateTime",
                table: "AppOrders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReplacementReasonValueId",
                table: "AppOrders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Balance120Days",
                table: "AppHouseAccountBillingHistories",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Balance30Days",
                table: "AppHouseAccountBillingHistories",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Balance60Days",
                table: "AppHouseAccountBillingHistories",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Balance90Days",
                table: "AppHouseAccountBillingHistories",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "BalanceOver120Days",
                table: "AppHouseAccountBillingHistories",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "LateFeeChargeable",
                table: "AppHouseAccountBillingHistories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsFinancialChargeTransaction",
                table: "AppFinancialTransactions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<Guid>(
                name: "DriverId",
                table: "AppDriverStatusTrackers",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CheckedInAt",
                table: "AppDriverStatusTrackers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CheckedOutAt",
                table: "AppDriverStatusTrackers",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateOnly>(
                name: "DeliveryDate",
                table: "AppDriverStatusTrackers",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<Guid>(
                name: "TripId",
                table: "AppDriverStatusTrackers",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<bool>(
                name: "LateFeeChargeable",
                table: "AppCustomerHouseAccounts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "StatementBillingCycle",
                table: "AppCustomerHouseAccounts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "TermsCodeId",
                table: "AppCustomerHouseAccounts",
                type: "uniqueidentifier",
                nullable: true);

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
                name: "AppTermsCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NetDueDays = table.Column<int>(type: "int", nullable: false),
                    AgingBucket = table.Column<int>(type: "int", nullable: false),
                    LateChargePercentage = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    MinimumLateChargeAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    LateChargeStatementDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppTermsCodes", x => x.Id);
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
                name: "AppWireServiceOrderAdditionalData",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WireService = table.Column<int>(type: "int", nullable: false),
                    StoreId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SubOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReceiverShopId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SendTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResponseTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RejectTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    WireServiceOrderStatus = table.Column<int>(type: "int", nullable: false),
                    RejectMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppWireServiceOrderAdditionalData", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppWireServiceOrderAdditionalData_AppShop_ReceiverShopId",
                        column: x => x.ReceiverShopId,
                        principalTable: "AppShop",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AppWireServiceOrderAdditionalData_AppStore_StoreId",
                        column: x => x.StoreId,
                        principalTable: "AppStore",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
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
                name: "IX_AppCustomerHouseAccounts_TermsCodeId",
                table: "AppCustomerHouseAccounts",
                column: "TermsCodeId");

            migrationBuilder.CreateIndex(
                name: "IX_AppPrinters_ComputerId",
                table: "AppPrinters",
                column: "ComputerId");

            migrationBuilder.CreateIndex(
                name: "IX_AppPrinterSetups_PrinterId",
                table: "AppPrinterSetups",
                column: "PrinterId");

            migrationBuilder.CreateIndex(
                name: "IX_AppWireServiceOrderAdditionalData_ReceiverShopId",
                table: "AppWireServiceOrderAdditionalData",
                column: "ReceiverShopId");

            migrationBuilder.CreateIndex(
                name: "IX_AppWireServiceOrderAdditionalData_StoreId",
                table: "AppWireServiceOrderAdditionalData",
                column: "StoreId");

            migrationBuilder.AddForeignKey(
                name: "FK_AppCustomerHouseAccounts_AppTermsCodes_TermsCodeId",
                table: "AppCustomerHouseAccounts",
                column: "TermsCodeId",
                principalTable: "AppTermsCodes",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppCustomerHouseAccounts_AppTermsCodes_TermsCodeId",
                table: "AppCustomerHouseAccounts");

            migrationBuilder.DropTable(
                name: "AppPrinterSetups");

            migrationBuilder.DropTable(
                name: "AppTermsCodes");

            migrationBuilder.DropTable(
                name: "AppUnapprovedCreditCardOrders");

            migrationBuilder.DropTable(
                name: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropTable(
                name: "AppPrinters");

            migrationBuilder.DropTable(
                name: "AppComputers");

            migrationBuilder.DropIndex(
                name: "IX_AppCustomerHouseAccounts_TermsCodeId",
                table: "AppCustomerHouseAccounts");

            migrationBuilder.DropColumn(
                name: "OrderCount",
                table: "AppWireServiceAllocationSettings");

            migrationBuilder.DropColumn(
                name: "ProductMinPrice",
                table: "AppShopProducts");

            migrationBuilder.DropColumn(
                name: "AdditionalComment",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "CanceledDateTime",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "ReplacementReasonValueId",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "Balance120Days",
                table: "AppHouseAccountBillingHistories");

            migrationBuilder.DropColumn(
                name: "Balance30Days",
                table: "AppHouseAccountBillingHistories");

            migrationBuilder.DropColumn(
                name: "Balance60Days",
                table: "AppHouseAccountBillingHistories");

            migrationBuilder.DropColumn(
                name: "Balance90Days",
                table: "AppHouseAccountBillingHistories");

            migrationBuilder.DropColumn(
                name: "BalanceOver120Days",
                table: "AppHouseAccountBillingHistories");

            migrationBuilder.DropColumn(
                name: "LateFeeChargeable",
                table: "AppHouseAccountBillingHistories");

            migrationBuilder.DropColumn(
                name: "IsFinancialChargeTransaction",
                table: "AppFinancialTransactions");

            migrationBuilder.DropColumn(
                name: "CheckedInAt",
                table: "AppDriverStatusTrackers");

            migrationBuilder.DropColumn(
                name: "CheckedOutAt",
                table: "AppDriverStatusTrackers");

            migrationBuilder.DropColumn(
                name: "DeliveryDate",
                table: "AppDriverStatusTrackers");

            migrationBuilder.DropColumn(
                name: "TripId",
                table: "AppDriverStatusTrackers");

            migrationBuilder.DropColumn(
                name: "LateFeeChargeable",
                table: "AppCustomerHouseAccounts");

            migrationBuilder.DropColumn(
                name: "StatementBillingCycle",
                table: "AppCustomerHouseAccounts");

            migrationBuilder.DropColumn(
                name: "TermsCodeId",
                table: "AppCustomerHouseAccounts");

            migrationBuilder.RenameColumn(
                name: "CheckedOutAt",
                table: "AppTrips",
                newName: "CheckOutDateTime");

            migrationBuilder.RenameColumn(
                name: "CheckedInAt",
                table: "AppTrips",
                newName: "CheckInDateTime");

            migrationBuilder.AlterColumn<Guid>(
                name: "DriverId",
                table: "AppDriverStatusTrackers",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<string>(
                name: "EmployeeId",
                table: "AppDriverStatusTrackers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "LastTripId",
                table: "AppDriverStatusTrackers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "WireServiceId",
                table: "AppDeliveryDetails",
                type: "uniqueidentifier",
                nullable: true);
        }
    }
}
