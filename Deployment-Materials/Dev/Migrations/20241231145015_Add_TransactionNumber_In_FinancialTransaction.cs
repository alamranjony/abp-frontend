using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class Add_TransactionNumber_In_FinancialTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AppFinancialTransactions_TenantId_ReferenceNumber",
                table: "AppFinancialTransactions");

            migrationBuilder.AddColumn<int>(
                name: "ProductCategoryType",
                table: "AppProduct",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransactionNumber",
                table: "AppFinancialTransactions",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_AppFinancialTransactions_ReferenceNumber",
                table: "AppFinancialTransactions",
                column: "ReferenceNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppFinancialTransactions_TransactionNumber",
                table: "AppFinancialTransactions",
                column: "TransactionNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AppFinancialTransactions_ReferenceNumber",
                table: "AppFinancialTransactions");

            migrationBuilder.DropIndex(
                name: "IX_AppFinancialTransactions_TransactionNumber",
                table: "AppFinancialTransactions");

            migrationBuilder.DropColumn(
                name: "ProductCategoryType",
                table: "AppProduct");

            migrationBuilder.DropColumn(
                name: "TransactionNumber",
                table: "AppFinancialTransactions");

            migrationBuilder.CreateIndex(
                name: "IX_AppFinancialTransactions_TenantId_ReferenceNumber",
                table: "AppFinancialTransactions",
                columns: new[] { "TenantId", "ReferenceNumber" },
                unique: true,
                filter: "[TenantId] IS NOT NULL");
        }
    }
}
