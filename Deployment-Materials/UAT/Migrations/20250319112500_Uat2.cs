using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class Uat2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "SenderId",
                table: "AppWireServiceSenders",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "AppVehicles",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<Guid>(
                name: "SubOrderId",
                table: "AppTripSubOrderMaps",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "ProductId",
                table: "AppSubOrders",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<int>(
                name: "OccasionCode",
                table: "AppSubOrders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<int>(
                name: "WireServiceId",
                table: "AppShop",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "OrderSent",
                table: "AppShop",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "OrderRejected",
                table: "AppShop",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "OrderReceived",
                table: "AppShop",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "OpenSunday",
                table: "AppShop",
                type: "bit",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "IsPreferred",
                table: "AppShop",
                type: "bit",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "IsFFC",
                table: "AppShop",
                type: "bit",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "IsBlocked",
                table: "AppShop",
                type: "bit",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "AppShop",
                type: "bit",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FSNId",
                table: "AppShop",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsShopInBloomNet",
                table: "AppShop",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsShopInFSN",
                table: "AppShop",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsShopInFTD",
                table: "AppShop",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsShopInMAS",
                table: "AppShop",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsShopInTeleFlora",
                table: "AppShop",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MasDirectId",
                table: "AppShop",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Latitude",
                table: "AppRecipients",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Longitude",
                table: "AppRecipients",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "WireOut",
                table: "AppProduct",
                type: "decimal(18,4)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "CheckNo",
                table: "AppPaymentMasters",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsRefunded",
                table: "AppPaymentHistories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "AppPaymentDetails",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AssignedDateTime",
                table: "AppOrders",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "AssignedUserId",
                table: "AppOrders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PostDate",
                table: "AppFinancialTransactions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeliverySlotId",
                table: "AppDeliveryDetails",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Balance120Days",
                table: "AppCustomerHouseAccounts",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Balance30Days",
                table: "AppCustomerHouseAccounts",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Balance60Days",
                table: "AppCustomerHouseAccounts",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Balance90Days",
                table: "AppCustomerHouseAccounts",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "BalanceOver120Days",
                table: "AppCustomerHouseAccounts",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "AppDeliverySlotSubOrderMaps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SubOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SlotId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SlotName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TripId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeliveryDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppDeliverySlotSubOrderMaps", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppTomTomApiKeySettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApiKey = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AlternativeKeysJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppTomTomApiKeySettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppWireServiceMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WireService = table.Column<int>(type: "int", nullable: false),
                    FromDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ToDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateType = table.Column<int>(type: "int", nullable: false),
                    MinAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    MaxAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StoreId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MessageType = table.Column<int>(type: "int", nullable: false),
                    ShopCodes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppWireServiceMessages", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppOrders_AssignedUserId",
                table: "AppOrders",
                column: "AssignedUserId",
                unique: true,
                filter: "[AssignedUserId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AppOrders_CurrentStoreId",
                table: "AppOrders",
                column: "CurrentStoreId");

            migrationBuilder.CreateIndex(
                name: "IX_AppDeliverySlotSubOrderMaps_SubOrderId",
                table: "AppDeliverySlotSubOrderMaps",
                column: "SubOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_AppOrders_AbpUsers_AssignedUserId",
                table: "AppOrders",
                column: "AssignedUserId",
                principalTable: "AbpUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_AppOrders_AppStore_CurrentStoreId",
                table: "AppOrders",
                column: "CurrentStoreId",
                principalTable: "AppStore",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppOrders_AbpUsers_AssignedUserId",
                table: "AppOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_AppOrders_AppStore_CurrentStoreId",
                table: "AppOrders");

            migrationBuilder.DropTable(
                name: "AppDeliverySlotSubOrderMaps");

            migrationBuilder.DropTable(
                name: "AppTomTomApiKeySettings");

            migrationBuilder.DropTable(
                name: "AppWireServiceMessages");

            migrationBuilder.DropIndex(
                name: "IX_AppOrders_AssignedUserId",
                table: "AppOrders");

            migrationBuilder.DropIndex(
                name: "IX_AppOrders_CurrentStoreId",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "AppVehicles");

            migrationBuilder.DropColumn(
                name: "OccasionCode",
                table: "AppSubOrders");

            migrationBuilder.DropColumn(
                name: "FSNId",
                table: "AppShop");

            migrationBuilder.DropColumn(
                name: "IsShopInBloomNet",
                table: "AppShop");

            migrationBuilder.DropColumn(
                name: "IsShopInFSN",
                table: "AppShop");

            migrationBuilder.DropColumn(
                name: "IsShopInFTD",
                table: "AppShop");

            migrationBuilder.DropColumn(
                name: "IsShopInMAS",
                table: "AppShop");

            migrationBuilder.DropColumn(
                name: "IsShopInTeleFlora",
                table: "AppShop");

            migrationBuilder.DropColumn(
                name: "MasDirectId",
                table: "AppShop");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "AppRecipients");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "AppRecipients");

            migrationBuilder.DropColumn(
                name: "CheckNo",
                table: "AppPaymentMasters");

            migrationBuilder.DropColumn(
                name: "IsRefunded",
                table: "AppPaymentHistories");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "AppPaymentDetails");

            migrationBuilder.DropColumn(
                name: "AssignedDateTime",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "AssignedUserId",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "PostDate",
                table: "AppFinancialTransactions");

            migrationBuilder.DropColumn(
                name: "DeliverySlotId",
                table: "AppDeliveryDetails");

            migrationBuilder.DropColumn(
                name: "Balance120Days",
                table: "AppCustomerHouseAccounts");

            migrationBuilder.DropColumn(
                name: "Balance30Days",
                table: "AppCustomerHouseAccounts");

            migrationBuilder.DropColumn(
                name: "Balance60Days",
                table: "AppCustomerHouseAccounts");

            migrationBuilder.DropColumn(
                name: "Balance90Days",
                table: "AppCustomerHouseAccounts");

            migrationBuilder.DropColumn(
                name: "BalanceOver120Days",
                table: "AppCustomerHouseAccounts");

            migrationBuilder.AlterColumn<int>(
                name: "SenderId",
                table: "AppWireServiceSenders",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "SubOrderId",
                table: "AppTripSubOrderMaps",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<Guid>(
                name: "ProductId",
                table: "AppSubOrders",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "WireServiceId",
                table: "AppShop",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "OrderSent",
                table: "AppShop",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "OrderRejected",
                table: "AppShop",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "OrderReceived",
                table: "AppShop",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "OpenSunday",
                table: "AppShop",
                type: "int",
                nullable: true,
                oldClrType: typeof(bool),
                oldType: "bit");

            migrationBuilder.AlterColumn<bool>(
                name: "IsPreferred",
                table: "AppShop",
                type: "bit",
                nullable: true,
                oldClrType: typeof(bool),
                oldType: "bit");

            migrationBuilder.AlterColumn<bool>(
                name: "IsFFC",
                table: "AppShop",
                type: "bit",
                nullable: true,
                oldClrType: typeof(bool),
                oldType: "bit");

            migrationBuilder.AlterColumn<bool>(
                name: "IsBlocked",
                table: "AppShop",
                type: "bit",
                nullable: true,
                oldClrType: typeof(bool),
                oldType: "bit");

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "AppShop",
                type: "bit",
                nullable: true,
                oldClrType: typeof(bool),
                oldType: "bit");

            migrationBuilder.AlterColumn<int>(
                name: "WireOut",
                table: "AppProduct",
                type: "int",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,4)");
        }
    }
}
