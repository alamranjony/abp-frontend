using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class RecipientDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppRecipientDeliveryDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RecipientId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeliveryFromDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeliveryToDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HasExpressFee = table.Column<bool>(type: "bit", nullable: false),
                    ExpressFee = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    DeliveryType = table.Column<int>(type: "int", nullable: false),
                    DeliveryZoneId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    FulfillingStoreId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SpecialInstruction = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeliveryFee = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    RelayFee = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    WireServiceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    HeadquarterCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CustomerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PickupLocationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PersonPickingUp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsPickedUp = table.Column<bool>(type: "bit", nullable: true),
                    PickedUpBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppRecipientDeliveryDetails", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppRecipientPersonalizations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RecipientName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShortCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CardMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeliveryDetailsId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppRecipientPersonalizations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppRecipients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    FirstName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    LocationType = table.Column<int>(type: "int", nullable: false),
                    Attention = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DeliveryCodeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Address1 = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Address2 = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ZipCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    StateProvinceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CountryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneType = table.Column<int>(type: "int", nullable: true),
                    Number = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ShortCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CustomerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppRecipients", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppRecipientDeliveryDetails_RecipientId",
                table: "AppRecipientDeliveryDetails",
                column: "RecipientId");

            migrationBuilder.CreateIndex(
                name: "IX_AppRecipientPersonalizations_DeliveryDetailsId",
                table: "AppRecipientPersonalizations",
                column: "DeliveryDetailsId");

            migrationBuilder.CreateIndex(
                name: "IX_AppRecipients_FirstName",
                table: "AppRecipients",
                column: "FirstName");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppRecipientDeliveryDetails");

            migrationBuilder.DropTable(
                name: "AppRecipientPersonalizations");

            migrationBuilder.DropTable(
                name: "AppRecipients");
        }
    }
}
