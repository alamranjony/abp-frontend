using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class CustomerHouseAccountDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasRecipes",
                table: "AppProduct",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "AppEmployees",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "AppMessageTemplate",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BccEmailAddresses = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Subject = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DelayBeforeSend = table.Column<int>(type: "int", nullable: true),
                    AttachedDownloadId = table.Column<int>(type: "int", nullable: false),
                    AllowDirectReply = table.Column<bool>(type: "bit", nullable: false),
                    LimitedToStores = table.Column<bool>(type: "bit", nullable: false),
                    DelayPeriod = table.Column<int>(type: "int", nullable: false),
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
                    table.PrimaryKey("PK_AppMessageTemplate", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppProductRecipes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    MasterProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BasePrice = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Comments = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppProductRecipes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppEmployees_UserId",
                table: "AppEmployees",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AppProductRecipes_MasterProductId",
                table: "AppProductRecipes",
                column: "MasterProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_AppEmployees_AbpUsers_UserId",
                table: "AppEmployees",
                column: "UserId",
                principalTable: "AbpUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppEmployees_AbpUsers_UserId",
                table: "AppEmployees");

            migrationBuilder.DropTable(
                name: "AppMessageTemplate");

            migrationBuilder.DropTable(
                name: "AppProductRecipes");

            migrationBuilder.DropIndex(
                name: "IX_AppEmployees_UserId",
                table: "AppEmployees");

            migrationBuilder.DropColumn(
                name: "HasRecipes",
                table: "AppProduct");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "AppEmployees");
        }
    }
}
