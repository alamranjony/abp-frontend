using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class AddTermsCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFinancialChargeTransaction",
                table: "AppFinancialTransactions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "LateFeeChargeable",
                table: "AppCustomerHouseAccounts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "StatementBillingCycle",
                table: "AppCustomerHouseAccounts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "TermsCodeId",
                table: "AppCustomerHouseAccounts",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AppTermsCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NetDueDays = table.Column<int>(type: "int", nullable: false),
                    AgingBucket = table.Column<int>(type: "int", nullable: false),
                    LateChargePercentage = table.Column<double>(type: "float", nullable: false),
                    MinimumLateChargeAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    LateChargeStatementDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppTermsCodes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppCustomerHouseAccounts_TermsCodeId",
                table: "AppCustomerHouseAccounts",
                column: "TermsCodeId");

            migrationBuilder.AddForeignKey(
                name: "FK_AppCustomerHouseAccounts_AppTermsCodes_TermsCodeId",
                table: "AppCustomerHouseAccounts",
                column: "TermsCodeId",
                principalTable: "AppTermsCodes",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppCustomerHouseAccounts_AppTermsCodes_TermsCodeId",
                table: "AppCustomerHouseAccounts");

            migrationBuilder.DropTable(
                name: "AppTermsCodes");

            migrationBuilder.DropIndex(
                name: "IX_AppCustomerHouseAccounts_TermsCodeId",
                table: "AppCustomerHouseAccounts");

            migrationBuilder.DropColumn(
                name: "IsFinancialChargeTransaction",
                table: "AppFinancialTransactions");

            migrationBuilder.DropColumn(
                name: "LateFeeChargeable",
                table: "AppCustomerHouseAccounts");

            migrationBuilder.DropColumn(
                name: "StatementBillingCycle",
                table: "AppCustomerHouseAccounts");

            migrationBuilder.DropColumn(
                name: "TermsCodeId",
                table: "AppCustomerHouseAccounts");
        }
    }
}
