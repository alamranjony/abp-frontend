using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class AppHouseAccountBillingHistories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PreviousMonthAmount",
                table: "AppCustomerHouseAccounts",
                newName: "RemainingCreditAmount");

            migrationBuilder.RenameColumn(
                name: "CurrentAmount",
                table: "AppCustomerHouseAccounts",
                newName: "PreviousMonthUnappliedAmount");

            migrationBuilder.AlterColumn<Guid>(
                name: "TripId",
                table: "AppTripSubOrderMaps",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "VehicleId",
                table: "AppTrips",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateOnly>(
                name: "TripDate",
                table: "AppTrips",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "DriverId",
                table: "AppTrips",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CustomTripId",
                table: "AppTrips",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MinOrderAmount",
                table: "AppShop",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PreviousMonthBilledAmount",
                table: "AppCustomerHouseAccounts",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "AppHouseAccountBillingHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DurationFrom = table.Column<DateOnly>(type: "date", nullable: false),
                    DurationTill = table.Column<DateOnly>(type: "date", nullable: false),
                    PreviousMonthBilledAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    PreviousMonthUnappliedAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    BilledCharge = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Balance = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    CurrentAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    CustomerHouseAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
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
                    table.PrimaryKey("PK_AppHouseAccountBillingHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppHouseAccountBillingHistories_AppCustomerHouseAccounts_CustomerHouseAccountId",
                        column: x => x.CustomerHouseAccountId,
                        principalTable: "AppCustomerHouseAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppHouseAccountBillingHistories_CustomerHouseAccountId",
                table: "AppHouseAccountBillingHistories",
                column: "CustomerHouseAccountId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppHouseAccountBillingHistories");

            migrationBuilder.DropColumn(
                name: "MinOrderAmount",
                table: "AppShop");

            migrationBuilder.DropColumn(
                name: "PreviousMonthBilledAmount",
                table: "AppCustomerHouseAccounts");

            migrationBuilder.RenameColumn(
                name: "RemainingCreditAmount",
                table: "AppCustomerHouseAccounts",
                newName: "PreviousMonthAmount");

            migrationBuilder.RenameColumn(
                name: "PreviousMonthUnappliedAmount",
                table: "AppCustomerHouseAccounts",
                newName: "CurrentAmount");

            migrationBuilder.AlterColumn<Guid>(
                name: "TripId",
                table: "AppTripSubOrderMaps",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<Guid>(
                name: "VehicleId",
                table: "AppTrips",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<DateTime>(
                name: "TripDate",
                table: "AppTrips",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date");

            migrationBuilder.AlterColumn<Guid>(
                name: "DriverId",
                table: "AppTrips",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<string>(
                name: "CustomTripId",
                table: "AppTrips",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");
        }
    }
}
