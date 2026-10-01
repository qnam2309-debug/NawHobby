using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GundamStoreApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAddressModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 2, 13, 35, 43, 393, DateTimeKind.Local).AddTicks(3505), "AQAAAAIAAYagAAAAEAcrhorwrPrQCtx1VnU5e8r6qJOB3Hyw4ZfR29XdglLcLSOZod1MvVpOcRVdSh4IOg==" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 2, 11, 27, 44, 250, DateTimeKind.Local).AddTicks(589), "AQAAAAIAAYagAAAAECfFK91s986MpVo+DpRkd4c5/+C9VvHU/PWGZiOJIfzI5VIgrDAIZZCW+SuxLHZ6nQ==" });
        }
    }
}
