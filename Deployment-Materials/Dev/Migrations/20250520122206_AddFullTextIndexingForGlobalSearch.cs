using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAS.FloraFire.ClientPortal.Migrations
{
    /// <inheritdoc />
    public partial class AddFullTextIndexingForGlobalSearch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                $@"
                IF NOT EXISTS (SELECT * FROM sys.fulltext_catalogs WHERE name = 'SearchCatalog')
                BEGIN
	                CREATE FULLTEXT CATALOG SearchCatalog AS DEFAULT;
                END

                IF NOT EXISTS (SELECT 1 
                               FROM sys.fulltext_indexes 
                               WHERE object_id = OBJECT_ID('dbo.AppSubOrders'))
                BEGIN
                    CREATE FULLTEXT INDEX ON [dbo].[AppSubOrders] (
                      SpecialInstruction,
                      OrderDetails
                    ) KEY INDEX PK_AppSubOrders;
                END

                IF NOT EXISTS (SELECT 1 
                               FROM sys.fulltext_indexes 
                               WHERE object_id = OBJECT_ID('dbo.AppOrders'))
                BEGIN
                    CREATE FULLTEXT INDEX ON [dbo].[AppOrders] (
                      AdditionalComment
                    ) KEY INDEX PK_AppOrders;
                END

                IF NOT EXISTS (SELECT 1 
                               FROM sys.fulltext_indexes 
                               WHERE object_id = OBJECT_ID('dbo.AppProduct'))
                BEGIN
                    CREATE FULLTEXT INDEX ON [dbo].[AppProduct] (
                      Name,
                      Description,
                      Comment
                    ) KEY INDEX PK_AppProduct;
                END

                IF NOT EXISTS (SELECT 1 
                               FROM sys.fulltext_indexes 
                               WHERE object_id = OBJECT_ID('dbo.AppRecipients'))
                BEGIN
                    CREATE FULLTEXT INDEX ON [dbo].[AppRecipients] (
                      FirstName,
                      LastName,
                      Address1,
                      Address2
                    ) KEY INDEX PK_AppRecipients;
                END

                IF NOT EXISTS (SELECT 1 
                               FROM sys.fulltext_indexes 
                               WHERE object_id = OBJECT_ID('dbo.AppDeliveryDetails'))
                BEGIN
                    CREATE FULLTEXT INDEX ON [dbo].[AppDeliveryDetails] (
                      SpecialInstruction
                    ) KEY INDEX PK_AppDeliveryDetails;
                END

                IF NOT EXISTS (SELECT 1 
                               FROM sys.fulltext_indexes 
                               WHERE object_id = OBJECT_ID('dbo.AppRecipientPersonalizations'))
                BEGIN
                    CREATE FULLTEXT INDEX ON [dbo].[AppRecipientPersonalizations] (
                      CardMessage
                    ) KEY INDEX PK_AppRecipientPersonalizations;
                END

                IF NOT EXISTS (SELECT 1 
                               FROM sys.fulltext_indexes 
                               WHERE object_id = OBJECT_ID('dbo.AppCustomer'))
                BEGIN
                    CREATE FULLTEXT INDEX ON [dbo].[AppCustomer] (
                      Name,
                      Address1,
                      Address2,
                      Comment,
                      CustomerReference
                    ) KEY INDEX PK_AppCustomer;
                END

                IF NOT EXISTS (SELECT 1 
                               FROM sys.fulltext_indexes 
                               WHERE object_id = OBJECT_ID('dbo.AppEmployees'))
                BEGIN
                    CREATE FULLTEXT INDEX ON [dbo].[AppEmployees] (
                      DisplayName
                    ) KEY INDEX PK_AppEmployees;
                END",
                suppressTransaction: true
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
