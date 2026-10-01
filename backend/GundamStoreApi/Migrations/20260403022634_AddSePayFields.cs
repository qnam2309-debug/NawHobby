using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GundamStoreApi.Migrations
{
    /// <inheritdoc />
    public partial class AddSePayFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPaid",
                table: "Orders",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OrderCode",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 3, 9, 26, 32, 873, DateTimeKind.Local).AddTicks(9423), "AQAAAAIAAYagAAAAEC6JXLaKXZPBSVsxmGrKyoh27jXORCxj49w4ZhBcOEmOb+znk2RU9/mc6zSZdT+xqA==" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPaid",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "OrderCode",
                table: "Orders");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 2, 13, 35, 43, 393, DateTimeKind.Local).AddTicks(3505), "AQAAAAIAAYagAAAAEAcrhorwrPrQCtx1VnU5e8r6qJOB3Hyw4ZfR29XdglLcLSOZod1MvVpOcRVdSh4IOg==" });
        }
    }
}
