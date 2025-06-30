using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCustomerHouseAccounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "WireOut",
                table: "AppProduct",
                type: "decimal(18,4)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<Guid>(
                name: "AssignedUserId",
                table: "AppOrders",
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

            migrationBuilder.CreateIndex(
                name: "IX_AppOrders_AssignedUserId",
                table: "AppOrders",
                column: "AssignedUserId",
                unique: true,
                filter: "[AssignedUserId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_AppOrders_AbpUsers_AssignedUserId",
                table: "AppOrders",
                column: "AssignedUserId",
                principalTable: "AbpUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppOrders_AbpUsers_AssignedUserId",
                table: "AppOrders");

            migrationBuilder.DropIndex(
                name: "IX_AppOrders_AssignedUserId",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "AssignedUserId",
                table: "AppOrders");

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
                name: "WireOut",
                table: "AppProduct",
                type: "int",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,4)");
        }
    }
}
