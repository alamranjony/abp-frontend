using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class CreationAndManagementOfGiftCard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "AppGiftCards");

            migrationBuilder.AddColumn<string>(
                name: "CustomerName",
                table: "AppGiftCards",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "StartingAmount",
                table: "AppGiftCards",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomerName",
                table: "AppGiftCards");

            migrationBuilder.DropColumn(
                name: "StartingAmount",
                table: "AppGiftCards");

            migrationBuilder.AddColumn<Guid>(
                name: "CustomerId",
                table: "AppGiftCards",
                type: "uniqueidentifier",
                nullable: true);
        }
    }
}
