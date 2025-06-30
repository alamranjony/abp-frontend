using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class DeliveryCharge : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
      

            migrationBuilder.AddColumn<bool>(
                name: "HasDeliveryCharge",
                table: "AppCustomer",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryCharge",
                table: "AppCustomer");

            migrationBuilder.DropColumn(
                name: "HasDeliveryCharge",
                table: "AppCustomer");
        }
    }
}
