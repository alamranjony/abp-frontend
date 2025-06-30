using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class ErrorLogAndDeliveryCodeMigrationChange : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "StatusCategoryName", table: "AppDeliveryCode");

            migrationBuilder.AlterColumn<int>(
                name: "SellingUnitOfMeasureValue",
                table: "AppProduct",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int"
            );

            migrationBuilder.AlterColumn<int>(
                name: "SellingUnitOfMeasure",
                table: "AppProduct",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int"
            );

            migrationBuilder.AlterColumn<int>(
                name: "PurchasedUnitOfMeasureValue",
                table: "AppProduct",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int"
            );
            
            //migrationBuilder.DropTable("AppErrorLog");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "SellingUnitOfMeasureValue",
                table: "AppProduct",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true
            );

            migrationBuilder.AlterColumn<int>(
                name: "SellingUnitOfMeasure",
                table: "AppProduct",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true
            );

            migrationBuilder.AlterColumn<int>(
                name: "PurchasedUnitOfMeasureValue",
                table: "AppProduct",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true
            );

            migrationBuilder.AddColumn<string>(
                name: "StatusCategoryName",
                table: "AppDeliveryCode",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: ""
            );
        }
    }
}
