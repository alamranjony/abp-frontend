using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmployeeId",
                table: "AppDriverStatusTrackers");

            migrationBuilder.DropColumn(
                name: "LastTripId",
                table: "AppDriverStatusTrackers");

            migrationBuilder.RenameColumn(
                name: "CheckOutDateTime",
                table: "AppTrips",
                newName: "CheckedOutAt");

            migrationBuilder.RenameColumn(
                name: "CheckInDateTime",
                table: "AppTrips",
                newName: "CheckedInAt");

            migrationBuilder.AddColumn<string>(
                name: "AdditionalComment",
                table: "AppOrders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CanceledDateTime",
                table: "AppOrders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "DriverId",
                table: "AppDriverStatusTrackers",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CheckedInAt",
                table: "AppDriverStatusTrackers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CheckedOutAt",
                table: "AppDriverStatusTrackers",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateOnly>(
                name: "DeliveryDate",
                table: "AppDriverStatusTrackers",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<Guid>(
                name: "TripId",
                table: "AppDriverStatusTrackers",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AdditionalComment",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "CanceledDateTime",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "CheckedInAt",
                table: "AppDriverStatusTrackers");

            migrationBuilder.DropColumn(
                name: "CheckedOutAt",
                table: "AppDriverStatusTrackers");

            migrationBuilder.DropColumn(
                name: "DeliveryDate",
                table: "AppDriverStatusTrackers");

            migrationBuilder.DropColumn(
                name: "TripId",
                table: "AppDriverStatusTrackers");

            migrationBuilder.RenameColumn(
                name: "CheckedOutAt",
                table: "AppTrips",
                newName: "CheckOutDateTime");

            migrationBuilder.RenameColumn(
                name: "CheckedInAt",
                table: "AppTrips",
                newName: "CheckInDateTime");

            migrationBuilder.AlterColumn<Guid>(
                name: "DriverId",
                table: "AppDriverStatusTrackers",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<string>(
                name: "EmployeeId",
                table: "AppDriverStatusTrackers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "LastTripId",
                table: "AppDriverStatusTrackers",
                type: "uniqueidentifier",
                nullable: true);
        }
    }
}
