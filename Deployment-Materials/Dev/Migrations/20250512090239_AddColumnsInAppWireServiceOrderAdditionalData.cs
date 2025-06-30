using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class AddColumnsInAppWireServiceOrderAdditionalData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppWireServiceOrderAdditionalData_AppShop_ReceiverShopId",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.AlterColumn<Guid>(
                name: "ReceiverShopId",
                table: "AppWireServiceOrderAdditionalData",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<string>(
                name: "FtdRelatedOrderReferenceNumber",
                table: "AppWireServiceOrderAdditionalData",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FtdRelatedOrderSequenceNumber",
                table: "AppWireServiceOrderAdditionalData",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TelefloraOperator",
                table: "AppWireServiceOrderAdditionalData",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TelefloraReceiverSequenceNumber",
                table: "AppWireServiceOrderAdditionalData",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TelefloraSenderSequenceNumber",
                table: "AppWireServiceOrderAdditionalData",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AppWireServiceOrderAdditionalData_AppShop_ReceiverShopId",
                table: "AppWireServiceOrderAdditionalData",
                column: "ReceiverShopId",
                principalTable: "AppShop",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppWireServiceOrderAdditionalData_AppShop_ReceiverShopId",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropColumn(
                name: "FtdRelatedOrderReferenceNumber",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropColumn(
                name: "FtdRelatedOrderSequenceNumber",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropColumn(
                name: "TelefloraOperator",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropColumn(
                name: "TelefloraReceiverSequenceNumber",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.DropColumn(
                name: "TelefloraSenderSequenceNumber",
                table: "AppWireServiceOrderAdditionalData");

            migrationBuilder.AlterColumn<Guid>(
                name: "ReceiverShopId",
                table: "AppWireServiceOrderAdditionalData",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AppWireServiceOrderAdditionalData_AppShop_ReceiverShopId",
                table: "AppWireServiceOrderAdditionalData",
                column: "ReceiverShopId",
                principalTable: "AppShop",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
