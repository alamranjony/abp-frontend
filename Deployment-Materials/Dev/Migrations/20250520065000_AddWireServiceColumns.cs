using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class AddWireServiceColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RecipientId",
                table: "AppOrders");

            migrationBuilder.RenameColumn(
                name: "FtdRelatedOrderSequenceNumber",
                table: "AppWireServiceOrderAdditionalData",
                newName: "FtdOrderSequenceNumber");

            migrationBuilder.RenameColumn(
                name: "FtdRelatedOrderReferenceNumber",
                table: "AppWireServiceOrderAdditionalData",
                newName: "MasMessageId");

            migrationBuilder.RenameColumn(
                name: "WireServiceType",
                table: "AppSubOrders",
                newName: "WireService");

            migrationBuilder.AddColumn<string>(
                name: "BloomNetInWireSequenceNo",
                table: "AppWireServiceOrderAdditionalData",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FtdAdminSequenceNumber",
                table: "AppWireServiceOrderAdditionalData",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "FtdReferenceNumber",
                table: "AppWireServiceOrderAdditionalData",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "FtdTransmissionId",
                table: "AppWireServiceOrderAdditionalData",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AlterColumn<string>(
                name: "WireServiceOrderId",
                table: "AppOrders",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ChangeDueAmount",
                table: "AppOrders",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_AppOrders_TenantId_WireServiceType_WireServiceOrderId",
                table: "AppOrders",
                columns: new[] { "TenantId", "WireServiceType", "WireServiceOrderId" },
                unique: true,
                filter: "[WireServiceOrderId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AppOrders_TenantId_WireServiceType_WireServiceOrderId",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "BloomNetInWireSequenceNo",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropColumn(
                name: "FtdAdminSequenceNumber",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropColumn(
                name: "FtdReferenceNumber",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropColumn(
                name: "FtdTransmissionId",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropColumn(
                name: "ChangeDueAmount",
                table: "AppOrders");

            migrationBuilder.RenameColumn(
                name: "MasMessageId",
                table: "AppWireServiceOrderAdditionalData",
                newName: "FtdRelatedOrderReferenceNumber");

            migrationBuilder.RenameColumn(
                name: "FtdOrderSequenceNumber",
                table: "AppWireServiceOrderAdditionalData",
                newName: "FtdRelatedOrderSequenceNumber");

            migrationBuilder.RenameColumn(
                name: "WireService",
                table: "AppSubOrders",
                newName: "WireServiceType");

            migrationBuilder.AlterColumn<string>(
                name: "WireServiceOrderId",
                table: "AppOrders",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RecipientId",
                table: "AppOrders",
                type: "uniqueidentifier",
                nullable: true);
        }
    }
}
