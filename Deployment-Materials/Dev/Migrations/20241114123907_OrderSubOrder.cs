using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class OrderSubOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT 1 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'AppErrorLog' 
                    AND COLUMN_NAME = 'UserId'
                )
                BEGIN
                    ALTER TABLE AppErrorLog DROP COLUMN UserId;
                END
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT 1 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'AppErrorLog' 
                    AND COLUMN_NAME = 'Username'
                )
                BEGIN
                 ALTER TABLE AppErrorLog ADD Username NVARCHAR(255);
                END
            ");

            migrationBuilder.AddColumn<string>(
                name: "TaxCertificate",
                table: "AppCustomer",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AppEcomLogins",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AccessToken = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExpireOnUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppEcomLogins", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppOrders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderType = table.Column<int>(type: "int", nullable: false),
                    OrderStatus = table.Column<int>(type: "int", nullable: false),
                    Total = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    DeliveryTotal = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    DiscountType = table.Column<int>(type: "int", nullable: true),
                    DiscountCode = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DiscountPercent = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    IsPartialPaymentAllowed = table.Column<bool>(type: "bit", nullable: false),
                    ReviewType = table.Column<int>(type: "int", nullable: true),
                    ShopId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CustomerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RecipientId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CancelSaleReasonValueId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReviewStatus = table.Column<int>(type: "int", nullable: true),
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
                    table.PrimaryKey("PK_AppOrders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppSubOrders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Qty = table.Column<int>(type: "int", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    SubTotal = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    RecipientId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SpecialInstruction = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsLock = table.Column<bool>(type: "bit", nullable: false),
                    DeliveryFrom = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeliveryTo = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CardMsg = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SlotId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ZoneId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsTimeRequired = table.Column<bool>(type: "bit", nullable: false),
                    DeliveryPriceType = table.Column<int>(type: "int", nullable: false),
                    IsCheckout = table.Column<bool>(type: "bit", nullable: false),
                    DeliveryFee = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    DeliveryTimeType = table.Column<int>(type: "int", nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    RelayFee = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    ShopId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PickupPersonName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PickupTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    OccasionTypeValueId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreditReasonValueId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SaleTypeId = table.Column<int>(type: "int", nullable: false),
                    CancelReasonValueId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReplaceReasonValueId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsPickup = table.Column<bool>(type: "bit", nullable: false),
                    IsCarryOut = table.Column<bool>(type: "bit", nullable: false),
                    WireOrderId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RetryNumber = table.Column<int>(type: "int", nullable: false),
                    CutOffFee = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    ExpressFee = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    WireOutFee = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    TimeReqFee = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    SundryFee = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    WeddingFee = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    IsWireServiceOrder = table.Column<bool>(type: "bit", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
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
                    table.PrimaryKey("PK_AppSubOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppSubOrders_AppOrders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "AppOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppSubOrders_OrderId",
                table: "AppSubOrders",
                column: "OrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppEcomLogins");

            migrationBuilder.DropTable(
                name: "AppSubOrders");

            migrationBuilder.DropTable(
                name: "AppOrders");

            migrationBuilder.DropColumn(
                name: "Username",
                table: "AppErrorLog");

            migrationBuilder.DropColumn(
                name: "TaxCertificate",
                table: "AppCustomer");

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "AppErrorLog",
                type: "uniqueidentifier",
                nullable: true);
        }
    }
}
