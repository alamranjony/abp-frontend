using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class AddWireServiceOrderAdditionalData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WireServiceId",
                table: "AppDeliveryDetails");

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

            migrationBuilder.CreateIndex(
                name: "IX_AppWireServiceOrderAdditionalData_ReceiverShopId",
                table: "AppWireServiceOrderAdditionalData",
                column: "ReceiverShopId");

            migrationBuilder.CreateIndex(
                name: "IX_AppWireServiceOrderAdditionalData_StoreId",
                table: "AppWireServiceOrderAdditionalData",
                column: "StoreId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropColumn(
                name: "OrderCount",
                table: "AppWireServiceAllocationSettings");

            migrationBuilder.DropColumn(
                name: "ProductMinPrice",
                table: "AppShopProducts");

            migrationBuilder.AddColumn<Guid>(
                name: "WireServiceId",
                table: "AppDeliveryDetails",
                type: "uniqueidentifier",
                nullable: true);
        }
    }
}
