using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class AddShopDirectory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "AppValueType");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "AppValueType");

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppShopDeliveryDetails");

            migrationBuilder.DropTable(
                name: "AppShopProducts");

            migrationBuilder.DropColumn(
                name: "StoreId",
                table: "AppShop");

            migrationBuilder.DropColumn(
                name: "ZipCodes",
                table: "AppShop");

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
