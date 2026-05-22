using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImpexioAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyBranchLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Branch",
                table: "CbmRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Company",
                table: "CbmRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "CbmRecords",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Branch",
                table: "CbmRecords");

            migrationBuilder.DropColumn(
                name: "Company",
                table: "CbmRecords");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "CbmRecords");
        }
    }
}
