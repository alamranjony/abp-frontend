using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePrinterSetupsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DesignerId",
                table: "AppSubOrders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreationTime",
                table: "AppPrinterSetups",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "CreatorId",
                table: "AppPrinterSetups",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PrinterOverrideType",
                table: "AppPrinterSetups",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "ValueId",
                table: "AppPrinterSetups",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppPrinterSetups_ValueId",
                table: "AppPrinterSetups",
                column: "ValueId");

            migrationBuilder.AddForeignKey(
                name: "FK_AppPrinterSetups_AppValue_ValueId",
                table: "AppPrinterSetups",
                column: "ValueId",
                principalTable: "AppValue",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppPrinterSetups_AppValue_ValueId",
                table: "AppPrinterSetups");

            migrationBuilder.DropIndex(
                name: "IX_AppPrinterSetups_ValueId",
                table: "AppPrinterSetups");

            migrationBuilder.DropColumn(
                name: "DesignerId",
                table: "AppSubOrders");

            migrationBuilder.DropColumn(
                name: "CreationTime",
                table: "AppPrinterSetups");

            migrationBuilder.DropColumn(
                name: "CreatorId",
                table: "AppPrinterSetups");

            migrationBuilder.DropColumn(
                name: "PrinterOverrideType",
                table: "AppPrinterSetups");

            migrationBuilder.DropColumn(
                name: "ValueId",
                table: "AppPrinterSetups");
        }
    }
}
