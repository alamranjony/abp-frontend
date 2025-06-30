using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class AppCreditCardSetups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppCreditCardSetups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PublicKey = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    SecretKey = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    DeveloperId = table.Column<string>(type: "nvarchar(6)", maxLength: 6, nullable: false),
                    VersionNumber = table.Column<string>(type: "nvarchar(4)", maxLength: 4, nullable: true),
                    ServiceUrl = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    StoreId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
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
                    table.PrimaryKey("PK_AppCreditCardSetups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppWireServiceAllocationSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WireServiceType = table.Column<int>(type: "int", nullable: false),
                    BloomNetQuota = table.Column<int>(type: "int", nullable: false),
                    TeleFloraQuota = table.Column<int>(type: "int", nullable: false),
                    FTDQuota = table.Column<int>(type: "int", nullable: false),
                    MasDirectQuota = table.Column<int>(type: "int", nullable: false),
                    FSNQuota = table.Column<int>(type: "int", nullable: false),
                    IncomingDeliveryCharge = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    WireInCommission = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    WireOutCommission = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    ClearingFees = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    ExchangeRate = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    StoreId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
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
                    table.PrimaryKey("PK_AppWireServiceAllocationSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppWireServiceSetups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WireService = table.Column<int>(type: "int", nullable: false),
                    HeadquarterCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AccountToken = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ShopCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Username = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Password = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CrossRefShopCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FloristAuthShopCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MemberCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InterfaceId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AutoForward = table.Column<bool>(type: "bit", nullable: true),
                    ConfirmationReq = table.Column<bool>(type: "bit", nullable: true),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    StoreId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppWireServiceSetups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppWireServiceSetups_AppStore_StoreId",
                        column: x => x.StoreId,
                        principalTable: "AppStore",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppCreditCardSetups_StoreId",
                table: "AppCreditCardSetups",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_AppWireServiceAllocationSettings_StoreId",
                table: "AppWireServiceAllocationSettings",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_AppWireServiceSetups_StoreId",
                table: "AppWireServiceSetups",
                column: "StoreId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppCreditCardSetups");

            migrationBuilder.DropTable(
                name: "AppWireServiceAllocationSettings");

            migrationBuilder.DropTable(
                name: "AppWireServiceSetups");
        }
    }
}
