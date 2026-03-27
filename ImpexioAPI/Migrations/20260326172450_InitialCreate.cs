using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImpexioAPI.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CbmRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CbmNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CbmDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DayBook = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ListingNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Exporter = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    PreparedBy = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Signatory = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CbmRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CbmContainerSummaries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CbmRecordId = table.Column<int>(type: "int", nullable: false),
                    ContainerType = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Cbm = table.Column<decimal>(type: "decimal(10,3)", nullable: true),
                    Mt = table.Column<decimal>(type: "decimal(10,3)", nullable: true),
                    Qty = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CbmContainerSummaries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CbmContainerSummaries_CbmRecords_CbmRecordId",
                        column: x => x.CbmRecordId,
                        principalTable: "CbmRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CbmItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CbmRecordId = table.Column<int>(type: "int", nullable: false),
                    CalcType = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Length = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Width = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Height = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Boxes = table.Column<int>(type: "int", nullable: true),
                    Result = table.Column<decimal>(type: "decimal(14,6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CbmItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CbmItems_CbmRecords_CbmRecordId",
                        column: x => x.CbmRecordId,
                        principalTable: "CbmRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CbmContainerSummaries_CbmRecordId",
                table: "CbmContainerSummaries",
                column: "CbmRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_CbmItems_CbmRecordId",
                table: "CbmItems",
                column: "CbmRecordId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CbmContainerSummaries");

            migrationBuilder.DropTable(
                name: "CbmItems");

            migrationBuilder.DropTable(
                name: "CbmRecords");
        }
    }
}
