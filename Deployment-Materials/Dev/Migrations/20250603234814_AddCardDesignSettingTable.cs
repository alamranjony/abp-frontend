using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class AddCardDesignSettingTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppCardDesignSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TemplateWidth = table.Column<double>(type: "float", nullable: false),
                    TemplateHeight = table.Column<double>(type: "float", nullable: false),
                    PreviewCardMessage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PreviewRecipientName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    OccasionType = table.Column<int>(type: "int", nullable: false),
                    IsCardMessage = table.Column<bool>(type: "bit", nullable: false),
                    IsRecipient = table.Column<bool>(type: "bit", nullable: false),
                    IsOccasion = table.Column<bool>(type: "bit", nullable: false),
                    CardFontFamily = table.Column<int>(type: "int", nullable: false),
                    CardFontStyle = table.Column<int>(type: "int", nullable: false),
                    CardMessageLeftMargin = table.Column<double>(type: "float", nullable: false),
                    CardMessageTopMargin = table.Column<double>(type: "float", nullable: false),
                    CardMessageWidth = table.Column<double>(type: "float", nullable: false),
                    CardFontSize = table.Column<int>(type: "int", nullable: false),
                    CardMessageTextColor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CardLineHeight = table.Column<double>(type: "float", nullable: false),
                    RecipientFontFamily = table.Column<int>(type: "int", nullable: false),
                    RecipientFontStyle = table.Column<int>(type: "int", nullable: false),
                    RecipientLeftMargin = table.Column<double>(type: "float", nullable: false),
                    RecipientTopMargin = table.Column<double>(type: "float", nullable: false),
                    RecipientWidth = table.Column<double>(type: "float", nullable: false),
                    RecipientFontSize = table.Column<int>(type: "int", nullable: false),
                    RecipientTextColor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OccasionFontFamily = table.Column<int>(type: "int", nullable: false),
                    OccasionFontStyle = table.Column<int>(type: "int", nullable: false),
                    OccasionLeftMargin = table.Column<double>(type: "float", nullable: false),
                    OccasionTopMargin = table.Column<double>(type: "float", nullable: false),
                    OccasionWidth = table.Column<double>(type: "float", nullable: false),
                    OccasionFontSize = table.Column<int>(type: "int", nullable: false),
                    OccasionTextColor = table.Column<string>(type: "nvarchar(max)", nullable: false),
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
                    table.PrimaryKey("PK_AppCardDesignSettings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppCardDesignSettings_StoreId",
                table: "AppCardDesignSettings",
                column: "StoreId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppCardDesignSettings");
        }
    }
}
