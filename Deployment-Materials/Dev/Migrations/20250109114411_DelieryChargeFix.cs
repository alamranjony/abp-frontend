using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class DelieryChargeFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
    IF NOT EXISTS (SELECT 1 
                   FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_NAME = 'AppCustomer' 
                   AND COLUMN_NAME = 'DeliveryCharge')
    BEGIN
        ALTER TABLE AppCustomer ADD DeliveryCharge DECIMAL(18, 4) NOT NULL DEFAULT 0;
    END");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
