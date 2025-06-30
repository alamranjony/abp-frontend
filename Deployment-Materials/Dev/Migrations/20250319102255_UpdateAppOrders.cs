using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAppOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AssignedDateTime",
                table: "AppOrders",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_AppOrders_CurrentStoreId",
                table: "AppOrders",
                column: "CurrentStoreId");

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
                name: "FK_AppOrders_AppStore_CurrentStoreId",
                table: "AppOrders");

            migrationBuilder.DropIndex(
                name: "IX_AppOrders_CurrentStoreId",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "AssignedDateTime",
                table: "AppOrders");
        }
    }
}
