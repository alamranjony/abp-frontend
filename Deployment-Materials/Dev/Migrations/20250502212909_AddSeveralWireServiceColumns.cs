using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class AddSeveralWireServiceColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "DeliveryModeId",
                table: "AppDeliverySlots",
                type: "uniqueidentifier",
                nullable: true,
                defaultValue: null);

            migrationBuilder.CreateIndex(
                name: "IX_AppDeliverySlots_DeliveryModeId",
                table: "AppDeliverySlots",
                column: "DeliveryModeId");

            migrationBuilder.AddForeignKey(
                name: "FK_AppDeliverySlots_AppDeliveryModes_DeliveryModeId",
                table: "AppDeliverySlots",
                column: "DeliveryModeId",
                principalTable: "AppDeliveryModes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.Sql($@"
                IF NOT EXISTS (SELECT 1 FROM AppDeliveryModes)
                BEGIN
                    INSERT INTO AppDeliveryModes (Id, Name, ExtraProperties,ConcurrencyStamp, CreationTime)
                    VALUES (NEWID(), 'Default Delivery Mode','{{}}',NEWID(), GETDATE())
                END
            ");

            migrationBuilder.Sql($@"
                UPDATE AppDeliverySlots
                SET DeliveryModeId = (SELECT TOP 1 Id FROM AppDeliveryModes)
                WHERE DeliveryModeId IS NULL");


            migrationBuilder.AlterColumn<Guid>(
                name: "DeliveryModeId",
                table: "AppDeliverySlots",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BloomNetBmtOrderNumber",
                table: "AppWireServiceOrderAdditionalData",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BloomNetBmtSeqNumberOfMessage",
                table: "AppWireServiceOrderAdditionalData",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BloomNetBmtSeqNumberOfOrder",
                table: "AppWireServiceOrderAdditionalData",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FsnOrderId",
                table: "AppWireServiceOrderAdditionalData",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FtdExternalReferenceNumber",
                table: "AppWireServiceOrderAdditionalData",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MasOrderNumber",
                table: "AppWireServiceOrderAdditionalData",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TelefloraTransactionId",
                table: "AppWireServiceOrderAdditionalData",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Mileage",
                table: "AppVehicles",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<Guid>(
                name: "StoreId",
                table: "AppSubOrders",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<int>(
                name: "WireServiceType",
                table: "AppSubOrders",
                type: "int",
                nullable: false,
                defaultValue: 0);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppDeliverySlots_AppDeliveryModes_DeliveryModeId",
                table: "AppDeliverySlots");

            migrationBuilder.DropIndex(
                name: "IX_AppDeliverySlots_DeliveryModeId",
                table: "AppDeliverySlots");

            migrationBuilder.DropColumn(
                name: "BloomNetBmtOrderNumber",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropColumn(
                name: "BloomNetBmtSeqNumberOfMessage",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropColumn(
                name: "BloomNetBmtSeqNumberOfOrder",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropColumn(
                name: "FsnOrderId",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropColumn(
                name: "FtdExternalReferenceNumber",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropColumn(
                name: "MasOrderNumber",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropColumn(
                name: "TelefloraTransactionId",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropColumn(
                name: "Mileage",
                table: "AppVehicles");

            migrationBuilder.DropColumn(
                name: "StoreId",
                table: "AppSubOrders");

            migrationBuilder.DropColumn(
                name: "WireServiceType",
                table: "AppSubOrders");

            migrationBuilder.DropColumn(
                name: "DeliveryModeId",
                table: "AppDeliverySlots");
        }
    }
}
