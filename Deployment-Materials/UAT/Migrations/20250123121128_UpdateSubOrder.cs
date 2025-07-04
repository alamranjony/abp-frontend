﻿using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSubOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsPickup",
                table: "AppSubOrders",
                newName: "IsWillPickup");

            migrationBuilder.AddColumn<Guid>(
                name: "DiscountId",
                table: "AppSubOrders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GiftCardNumber",
                table: "AppPaymentHistories",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppSubOrders_ProductId",
                table: "AppSubOrders",
                column: "ProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_AppSubOrders_AppProduct_ProductId",
                table: "AppSubOrders",
                column: "ProductId",
                principalTable: "AppProduct",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppSubOrders_AppProduct_ProductId",
                table: "AppSubOrders");

            migrationBuilder.DropIndex(
                name: "IX_AppSubOrders_ProductId",
                table: "AppSubOrders");

            migrationBuilder.DropColumn(
                name: "DiscountId",
                table: "AppSubOrders");

            migrationBuilder.DropColumn(
                name: "GiftCardNumber",
                table: "AppPaymentHistories");

            migrationBuilder.RenameColumn(
                name: "IsWillPickup",
                table: "AppSubOrders",
                newName: "IsPickup");
        }
    }
}
