using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class Uat102 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BloomNetQuota",
                table: "AppWireServiceAllocationSettings");

            migrationBuilder.DropColumn(
                name: "FSNQuota",
                table: "AppWireServiceAllocationSettings");

            migrationBuilder.DropColumn(
                name: "FTDQuota",
                table: "AppWireServiceAllocationSettings");

            migrationBuilder.DropColumn(
                name: "MasDirectQuota",
                table: "AppWireServiceAllocationSettings");

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "AppValueType");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "AppValueType");

            migrationBuilder.RenameColumn(
                name: "TeleFloraQuota",
                table: "AppWireServiceAllocationSettings",
                newName: "Quota");

            migrationBuilder.RenameColumn(
                name: "TransactionStatus",
                table: "AppFinancialTransactions",
                newName: "AccountingStatus");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "AppValue",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveredDate",
                table: "AppSubOrders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SalesTax",
                table: "AppSubOrders",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "SubOrderNumber",
                table: "AppSubOrders",
                type: "int",
                nullable: false,
                defaultValue: 0)
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<Guid>(
                name: "StoreId",
                table: "AppShop",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "ZipCodes",
                table: "AppShop",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ParentOrderId",
                table: "AppOrders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WireServiceOrderId",
                table: "AppOrders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WireServiceType",
                table: "AppOrders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsHouseAccountTransaction",
                table: "AppFinancialTransactions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "AppBatchDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BatchNo = table.Column<int>(type: "int", nullable: false),
                    StoreId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BatchTotalAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    FulfilledAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    DueAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    PaymentTransactionCodeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TransactionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeleterId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppBatchDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppBatchDetails_AppPaymentTransactionCodes_PaymentTransactionCodeId",
                        column: x => x.PaymentTransactionCodeId,
                        principalTable: "AppPaymentTransactionCodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AppDriverStatusTrackers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DriverId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    EmployeeId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DriverStatus = table.Column<int>(type: "int", nullable: false),
                    LastTripId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppDriverStatusTrackers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppShopDeliveryDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    WorkingDaySchedule = table.Column<int>(type: "int", nullable: false),
                    HolidaySchedule = table.Column<int>(type: "int", nullable: false),
                    WorkingDayStartTime = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HolidayStartTime = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    WorkingDayEndTime = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HolidayEndTime = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsCloseOnWorkingDay = table.Column<bool>(type: "bit", nullable: false),
                    IsCloseOnHoliday = table.Column<bool>(type: "bit", nullable: false),
                    ShopId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeleterId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppShopDeliveryDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppShopDeliveryDetails_AppShop_ShopId",
                        column: x => x.ShopId,
                        principalTable: "AppShop",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AppShopProducts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShopId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeleterId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppShopProducts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppShopProducts_AppShop_ShopId",
                        column: x => x.ShopId,
                        principalTable: "AppShop",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AppTrips",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CustomTripId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    DriverId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    VehicleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TripStatusType = table.Column<int>(type: "int", nullable: false),
                    NoOfDeliveries = table.Column<int>(type: "int", nullable: false),
                    CheckOutDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CheckInDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TripDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ETA = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppTrips", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppTripSubOrderMaps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TripId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SubOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeliveryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    StoreId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SlotName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ZoneName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DateRange = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Latitude = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Longitude = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    DisplayCharacter = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppTripSubOrderMaps", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppWireServiceSenders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SenderId = table.Column<int>(type: "int", nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    State = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Zip = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    WireServiceType = table.Column<int>(type: "int", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeleterId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppWireServiceSenders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppBatchAccounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CustomerNo = table.Column<int>(type: "int", nullable: false),
                    CheckNo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CardNo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PaymentAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    TotalAppliedAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    LeftOverAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BatchDetailId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeleterId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppBatchAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppBatchAccounts_AppBatchDetails_BatchDetailId",
                        column: x => x.BatchDetailId,
                        principalTable: "AppBatchDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AppBatchInvoices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TransactionNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CardNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CheckNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    AppliedAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    BatchAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeleterId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppBatchInvoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppBatchInvoices_AppBatchAccounts_BatchAccountId",
                        column: x => x.BatchAccountId,
                        principalTable: "AppBatchAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppBatchAccounts_BatchDetailId",
                table: "AppBatchAccounts",
                column: "BatchDetailId");

            migrationBuilder.CreateIndex(
                name: "IX_AppBatchAccounts_CustomerNo",
                table: "AppBatchAccounts",
                column: "CustomerNo");

            migrationBuilder.CreateIndex(
                name: "IX_AppBatchDetails_BatchNo",
                table: "AppBatchDetails",
                column: "BatchNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppBatchDetails_PaymentTransactionCodeId",
                table: "AppBatchDetails",
                column: "PaymentTransactionCodeId");

            migrationBuilder.CreateIndex(
                name: "IX_AppBatchInvoices_BatchAccountId",
                table: "AppBatchInvoices",
                column: "BatchAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_AppDriverStatusTrackers_DriverId",
                table: "AppDriverStatusTrackers",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_AppShopDeliveryDetails_ShopId",
                table: "AppShopDeliveryDetails",
                column: "ShopId");

            migrationBuilder.CreateIndex(
                name: "IX_AppShopProducts_ProductId",
                table: "AppShopProducts",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_AppShopProducts_ShopId",
                table: "AppShopProducts",
                column: "ShopId");

            migrationBuilder.CreateIndex(
                name: "IX_AppTrips_CustomTripId",
                table: "AppTrips",
                column: "CustomTripId");

            migrationBuilder.CreateIndex(
                name: "IX_AppTripSubOrderMaps_SubOrderId",
                table: "AppTripSubOrderMaps",
                column: "SubOrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppBatchInvoices");

            migrationBuilder.DropTable(
                name: "AppDriverStatusTrackers");

            migrationBuilder.DropTable(
                name: "AppShopDeliveryDetails");

            migrationBuilder.DropTable(
                name: "AppShopProducts");

            migrationBuilder.DropTable(
                name: "AppTrips");

            migrationBuilder.DropTable(
                name: "AppTripSubOrderMaps");

            migrationBuilder.DropTable(
                name: "AppWireServiceSenders");

            migrationBuilder.DropTable(
                name: "AppBatchAccounts");

            migrationBuilder.DropTable(
                name: "AppBatchDetails");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "AppValue");

            migrationBuilder.DropColumn(
                name: "DeliveredDate",
                table: "AppSubOrders");

            migrationBuilder.DropColumn(
                name: "SalesTax",
                table: "AppSubOrders");

            migrationBuilder.DropColumn(
                name: "SubOrderNumber",
                table: "AppSubOrders");

            migrationBuilder.DropColumn(
                name: "StoreId",
                table: "AppShop");

            migrationBuilder.DropColumn(
                name: "ZipCodes",
                table: "AppShop");

            migrationBuilder.DropColumn(
                name: "ParentOrderId",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "WireServiceOrderId",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "WireServiceType",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "IsHouseAccountTransaction",
                table: "AppFinancialTransactions");

            migrationBuilder.RenameColumn(
                name: "Quota",
                table: "AppWireServiceAllocationSettings",
                newName: "TeleFloraQuota");

            migrationBuilder.RenameColumn(
                name: "AccountingStatus",
                table: "AppFinancialTransactions",
                newName: "TransactionStatus");

            migrationBuilder.AddColumn<int>(
                name: "BloomNetQuota",
                table: "AppWireServiceAllocationSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FSNQuota",
                table: "AppWireServiceAllocationSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FTDQuota",
                table: "AppWireServiceAllocationSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MasDirectQuota",
                table: "AppWireServiceAllocationSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "AppValueType",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "ParentId",
                table: "AppValueType",
                type: "uniqueidentifier",
                nullable: true);
        }
    }
}
