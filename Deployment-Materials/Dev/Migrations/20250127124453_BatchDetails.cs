using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class BatchDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BloomNetQuota",
                table: "AppWireServiceAllocationSettings");

            migrationBuilder.DropColumn(
                name: "FSNQuota",
                table: "AppWireServiceAllocationSettings");

            migrationBuilder.DropColumn(
                name: "FTDQuota",
                table: "AppWireServiceAllocationSettings");

            migrationBuilder.DropColumn(
                name: "MasDirectQuota",
                table: "AppWireServiceAllocationSettings");

            migrationBuilder.RenameColumn(
                name: "TeleFloraQuota",
                table: "AppWireServiceAllocationSettings",
                newName: "Quota");

            migrationBuilder.RenameColumn(
                name: "TransactionStatus",
                table: "AppFinancialTransactions",
                newName: "AccountingStatus");

            migrationBuilder.AddColumn<Guid>(
                name: "ParentOrderId",
                table: "AppOrders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsHouseAccountTransaction",
                table: "AppFinancialTransactions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "AppBatchDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BatchNo = table.Column<int>(type: "int", nullable: false),
                    StoreId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BatchTotalAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    FulfilledAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    DueAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    PaymentTransactionCodeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TransactionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
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
                    table.PrimaryKey("PK_AppBatchDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppBatchDetails_AppPaymentTransactionCodes_PaymentTransactionCodeId",
                        column: x => x.PaymentTransactionCodeId,
                        principalTable: "AppPaymentTransactionCodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AppBatchAccounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CustomerNo = table.Column<int>(type: "int", nullable: false),
                    CheckNo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CardNo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PaymentAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    TotalAppliedAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    LeftOverAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BatchDetailId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
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
                    table.PrimaryKey("PK_AppBatchAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppBatchAccounts_AppBatchDetails_BatchDetailId",
                        column: x => x.BatchDetailId,
                        principalTable: "AppBatchDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AppBatchInvoices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TransactionNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CardNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CheckNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    AppliedAmount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    BatchAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
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
                    table.PrimaryKey("PK_AppBatchInvoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppBatchInvoices_AppBatchAccounts_BatchAccountId",
                        column: x => x.BatchAccountId,
                        principalTable: "AppBatchAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppBatchAccounts_BatchDetailId",
                table: "AppBatchAccounts",
                column: "BatchDetailId");

            migrationBuilder.CreateIndex(
                name: "IX_AppBatchAccounts_CustomerNo",
                table: "AppBatchAccounts",
                column: "CustomerNo");

            migrationBuilder.CreateIndex(
                name: "IX_AppBatchDetails_BatchNo",
                table: "AppBatchDetails",
                column: "BatchNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppBatchDetails_PaymentTransactionCodeId",
                table: "AppBatchDetails",
                column: "PaymentTransactionCodeId");

            migrationBuilder.CreateIndex(
                name: "IX_AppBatchInvoices_BatchAccountId",
                table: "AppBatchInvoices",
                column: "BatchAccountId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppBatchInvoices");

            migrationBuilder.DropTable(
                name: "AppBatchAccounts");

            migrationBuilder.DropTable(
                name: "AppBatchDetails");

            migrationBuilder.DropColumn(
                name: "ParentOrderId",
                table: "AppOrders");

            migrationBuilder.DropColumn(
                name: "IsHouseAccountTransaction",
                table: "AppFinancialTransactions");

            migrationBuilder.RenameColumn(
                name: "Quota",
                table: "AppWireServiceAllocationSettings",
                newName: "TeleFloraQuota");

            migrationBuilder.RenameColumn(
                name: "AccountingStatus",
                table: "AppFinancialTransactions",
                newName: "TransactionStatus");

            migrationBuilder.AddColumn<int>(
                name: "BloomNetQuota",
                table: "AppWireServiceAllocationSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FSNQuota",
                table: "AppWireServiceAllocationSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FTDQuota",
                table: "AppWireServiceAllocationSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MasDirectQuota",
                table: "AppWireServiceAllocationSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
