using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class RecipientsUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShortCode",
                table: "AppRecipients");

            migrationBuilder.DropColumn(
                name: "ExpressFee",
                table: "AppRecipientDeliveryDetails");

            migrationBuilder.DropColumn(
                name: "HasExpressFee",
                table: "AppRecipientDeliveryDetails");

            migrationBuilder.AddColumn<Guid>(
                name: "AddressShortCode",
                table: "AppRecipients",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeliveryFeeType",
                table: "AppRecipientDeliveryDetails",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AddressShortCode",
                table: "AppRecipients");

            migrationBuilder.DropColumn(
                name: "DeliveryFeeType",
                table: "AppRecipientDeliveryDetails");

            migrationBuilder.AddColumn<string>(
                name: "ShortCode",
                table: "AppRecipients",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ExpressFee",
                table: "AppRecipientDeliveryDetails",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "HasExpressFee",
                table: "AppRecipientDeliveryDetails",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
