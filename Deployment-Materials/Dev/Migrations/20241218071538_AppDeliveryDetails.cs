using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class AppDeliveryDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppRecipientDeliveryDetails");

            migrationBuilder.DropIndex(
                name: "IX_AppRecipientPersonalizations_DeliveryDetailsId",
                table: "AppRecipientPersonalizations");

            migrationBuilder.DropColumn(
                name: "DeliveryDetailsId",
                table: "AppRecipientPersonalizations");

            migrationBuilder.DropColumn(
                name: "ShortCode",
                table: "AppRecipientPersonalizations");

            migrationBuilder.DropColumn(
                name: "DiscountCode",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "DiscountType",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "StoreId",
                table: "AppErrorLog");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "AppAuditLog");

            migrationBuilder.RenameColumn(
                name: "DeliveryPriceType",
                table: "AppSubOrders",
                newName: "PriceType");

            migrationBuilder.RenameColumn(
                name: "PhoneType",
                table: "AppRecipients",
                newName: "NumberType");

            migrationBuilder.RenameColumn(
                name: "Number",
                table: "AppRecipients",
                newName: "PhoneNumber");

            migrationBuilder.RenameColumn(
                name: "OrderId",
                table: "AppRecipientPersonalizations",
                newName: "ShortCodeId");

            migrationBuilder.RenameColumn(
                name: "Total",
                table: "AppOrders",
                newName: "TaxAmount");

            migrationBuilder.RenameColumn(
                name: "DiscountPercent",
                table: "AppOrders",
                newName: "PaidAmount");

            migrationBuilder.RenameColumn(
                name: "ShopId",
                table: "AppAuditLog",
                newName: "StoreId");

            migrationBuilder.AddColumn<int>(
                name: "DeliveryCategory",
                table: "AppSubOrders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "DeliveryDetailId",
                table: "AppSubOrders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeliveryStatus",
                table: "AppSubOrders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "SubOrderId",
                table: "AppRecipientPersonalizations",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<bool>(
                name: "IsAllowPartialStockSale",
                table: "AppProduct",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "DeliveryStatus",
                table: "AppOrders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "DiscountCodeId",
                table: "AppOrders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmployeeId",
                table: "AppOrders",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "OrderDiscount",
                table: "AppOrders",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "OrderTotal",
                table: "AppOrders",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "PaymentStatus",
                table: "AppOrders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "StoreName",
                table: "AppErrorLog",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TenantName",
                table: "AppErrorLog",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "AppAuditType",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AppDeliveryDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DeliveryFromDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeliveryToDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeliveryFeeType = table.Column<int>(type: "int", nullable: true),
                    DeliveryType = table.Column<int>(type: "int", nullable: false),
                    DeliveryZoneId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    FulfillingStoreId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsTimeRequired = table.Column<bool>(type: "bit", nullable: false),
                    DeliveryTimeHour = table.Column<int>(type: "int", nullable: true),
                    DeliveryTimeMinute = table.Column<int>(type: "int", nullable: true),
                    DeliveryTimeType = table.Column<int>(type: "int", nullable: true),
                    SpecialInstruction = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeliveryFee = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    RelayFee = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    WireServiceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    HeadquarterCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CustomerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PickupLocationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PersonPickingUp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsPickedUp = table.Column<bool>(type: "bit", nullable: true),
                    PickedUpBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RecipientId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
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
                    table.PrimaryKey("PK_AppDeliveryDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppDeliveryDetails_AppRecipients_RecipientId",
                        column: x => x.RecipientId,
                        principalTable: "AppRecipients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppSubOrders_DeliveryDetailId",
                table: "AppSubOrders",
                column: "DeliveryDetailId",
                unique: true,
                filter: "[DeliveryDetailId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AppSubOrders_RecipientId",
                table: "AppSubOrders",
                column: "RecipientId");

            migrationBuilder.CreateIndex(
                name: "IX_AppRecipientPersonalizations_SubOrderId",
                table: "AppRecipientPersonalizations",
                column: "SubOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_AppAuditLog_StoreId",
                table: "AppAuditLog",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_AppDeliveryDetails_RecipientId",
                table: "AppDeliveryDetails",
                column: "RecipientId");

            migrationBuilder.AddForeignKey(
                name: "FK_AppAuditLog_AppStore_StoreId",
                table: "AppAuditLog",
                column: "StoreId",
                principalTable: "AppStore",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AppRecipientPersonalizations_AppSubOrders_SubOrderId",
                table: "AppRecipientPersonalizations",
                column: "SubOrderId",
                principalTable: "AppSubOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AppSubOrders_AppDeliveryDetails_DeliveryDetailId",
                table: "AppSubOrders",
                column: "DeliveryDetailId",
                principalTable: "AppDeliveryDetails",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AppSubOrders_AppRecipients_RecipientId",
                table: "AppSubOrders",
                column: "RecipientId",
                principalTable: "AppRecipients",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppAuditLog_AppStore_StoreId",
                table: "AppAuditLog");

            migrationBuilder.DropForeignKey(
                name: "FK_AppRecipientPersonalizations_AppSubOrders_SubOrderId",
                table: "AppRecipientPersonalizations");

            migrationBuilder.DropForeignKey(
                name: "FK_AppSubOrders_AppDeliveryDetails_DeliveryDetailId",
                table: "AppSubOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_AppSubOrders_AppRecipients_RecipientId",
                table: "AppSubOrders");

            migrationBuilder.DropTable(
                name: "AppDeliveryDetails");

            migrationBuilder.DropIndex(
                name: "IX_AppSubOrders_DeliveryDetailId",
                table: "AppSubOrders");

            migrationBuilder.DropIndex(
                name: "IX_AppSubOrders_RecipientId",
                table: "AppSubOrders");

            migrationBuilder.DropIndex(
                name: "IX_AppRecipientPersonalizations_SubOrderId",
                table: "AppRecipientPersonalizations");

            migrationBuilder.DropIndex(
                name: "IX_AppAuditLog_StoreId",
                table: "AppAuditLog");

            migrationBuilder.DropColumn(
                name: "DeliveryCategory",
                table: "AppSubOrders");

            migrationBuilder.DropColumn(
                name: "DeliveryDetailId",
                table: "AppSubOrders");

            migrationBuilder.DropColumn(
                name: "DeliveryStatus",
                table: "AppSubOrders");

            migrationBuilder.DropColumn(
                name: "SubOrderId",
                table: "AppRecipientPersonalizations");

            migrationBuilder.DropColumn(
                name: "IsAllowPartialStockSale",
                table: "AppProduct");

            migrationBuilder.DropColumn(
                name: "DeliveryStatus",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "DiscountCodeId",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "EmployeeId",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "OrderDiscount",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "OrderTotal",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "StoreName",
                table: "AppErrorLog");

            migrationBuilder.DropColumn(
                name: "TenantName",
                table: "AppErrorLog");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "AppAuditType");

            migrationBuilder.RenameColumn(
                name: "PriceType",
                table: "AppSubOrders",
                newName: "DeliveryPriceType");

            migrationBuilder.RenameColumn(
                name: "PhoneNumber",
                table: "AppRecipients",
                newName: "Number");

            migrationBuilder.RenameColumn(
                name: "NumberType",
                table: "AppRecipients",
                newName: "PhoneType");

            migrationBuilder.RenameColumn(
                name: "ShortCodeId",
                table: "AppRecipientPersonalizations",
                newName: "OrderId");

            migrationBuilder.RenameColumn(
                name: "TaxAmount",
                table: "AppOrders",
                newName: "Total");

            migrationBuilder.RenameColumn(
                name: "PaidAmount",
                table: "AppOrders",
                newName: "DiscountPercent");

            migrationBuilder.RenameColumn(
                name: "StoreId",
                table: "AppAuditLog",
                newName: "ShopId");

            migrationBuilder.AddColumn<Guid>(
                name: "DeliveryDetailsId",
                table: "AppRecipientPersonalizations",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShortCode",
                table: "AppRecipientPersonalizations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DiscountCode",
                table: "AppOrders",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DiscountType",
                table: "AppOrders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "StoreId",
                table: "AppErrorLog",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CustomerId",
                table: "AppAuditLog",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AppRecipientDeliveryDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CustomerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeliveryFee = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    DeliveryFeeType = table.Column<int>(type: "int", nullable: true),
                    DeliveryFromDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeliveryToDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeliveryType = table.Column<int>(type: "int", nullable: false),
                    DeliveryZoneId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FulfillingStoreId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    HeadquarterCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsPickedUp = table.Column<bool>(type: "bit", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PersonPickingUp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PickedUpBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PickupLocationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RecipientId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RelayFee = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    SpecialInstruction = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    WireServiceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppRecipientDeliveryDetails", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppRecipientPersonalizations_DeliveryDetailsId",
                table: "AppRecipientPersonalizations",
                column: "DeliveryDetailsId");

            migrationBuilder.CreateIndex(
                name: "IX_AppRecipientDeliveryDetails_RecipientId",
                table: "AppRecipientDeliveryDetails",
                column: "RecipientId");
        }
    }
}
