using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTable2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "LateChargePercentage",
                table: "AppTermsCodes",
                type: "decimal(18,4)",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "float");

            migrationBuilder.AddColumn<Guid>(
                name: "ReplacementReasonValueId",
                table: "AppOrders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Balance120Days",
                table: "AppHouseAccountBillingHistories",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Balance30Days",
                table: "AppHouseAccountBillingHistories",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Balance60Days",
                table: "AppHouseAccountBillingHistories",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Balance90Days",
                table: "AppHouseAccountBillingHistories",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "BalanceOver120Days",
                table: "AppHouseAccountBillingHistories",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "LateFeeChargeable",
                table: "AppHouseAccountBillingHistories",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReplacementReasonValueId",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "Balance120Days",
                table: "AppHouseAccountBillingHistories");

            migrationBuilder.DropColumn(
                name: "Balance30Days",
                table: "AppHouseAccountBillingHistories");

            migrationBuilder.DropColumn(
                name: "Balance60Days",
                table: "AppHouseAccountBillingHistories");

            migrationBuilder.DropColumn(
                name: "Balance90Days",
                table: "AppHouseAccountBillingHistories");

            migrationBuilder.DropColumn(
                name: "BalanceOver120Days",
                table: "AppHouseAccountBillingHistories");

            migrationBuilder.DropColumn(
                name: "LateFeeChargeable",
                table: "AppHouseAccountBillingHistories");

            migrationBuilder.AlterColumn<double>(
                name: "LateChargePercentage",
                table: "AppTermsCodes",
                type: "float",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,4)");
        }
    }
}
