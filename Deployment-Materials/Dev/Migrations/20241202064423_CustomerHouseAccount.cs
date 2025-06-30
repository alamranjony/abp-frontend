using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class CustomerHouseAccount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TypeId",
                table: "AppCustomer");

            migrationBuilder.AddColumn<string>(
                name: "OrderDetails",
                table: "AppSubOrders",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OrderNumber",
                table: "AppOrders",
                type: "int",
                nullable: false,
                defaultValue: 0)
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<int>(
                name: "CustomerAccountType",
                table: "AppCustomer",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "AppCustomerHouseAccounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PreviousMonthAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    UnBilledCharge = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    BilledCharge = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Credit = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Payment = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Balance = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    CurrentAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    CreditLimit = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    UnAppliedAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
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
                    table.PrimaryKey("PK_AppCustomerHouseAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppCustomerHouseAccounts_AppCustomer_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "AppCustomer",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppCustomerHouseAccounts_CustomerId",
                table: "AppCustomerHouseAccounts",
                column: "CustomerId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppCustomerHouseAccounts");

            migrationBuilder.DropColumn(
                name: "OrderDetails",
                table: "AppSubOrders");

            migrationBuilder.DropColumn(
                name: "OrderNumber",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "CustomerAccountType",
                table: "AppCustomer");

            migrationBuilder.AddColumn<Guid>(
                name: "TypeId",
                table: "AppCustomer",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));
        }
    }
}
