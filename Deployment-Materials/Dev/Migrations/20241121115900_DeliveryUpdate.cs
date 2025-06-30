using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class DeliveryUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DefaultDeliveryCharge",
                table: "AppDeliveryShortCodes");

            migrationBuilder.AlterColumn<decimal>(
                name: "SpecialDeliveryCharge",
                table: "AppDeliveryShortCodes",
                type: "decimal(18,4)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AddColumn<bool>(
                name: "UseDefaultDeliveryCharge",
                table: "AppDeliveryShortCodes",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UseDefaultDeliveryCharge",
                table: "AppDeliveryShortCodes");

            migrationBuilder.AlterColumn<decimal>(
                name: "SpecialDeliveryCharge",
                table: "AppDeliveryShortCodes",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,4)");

            migrationBuilder.AddColumn<decimal>(
                name: "DefaultDeliveryCharge",
                table: "AppDeliveryShortCodes",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
