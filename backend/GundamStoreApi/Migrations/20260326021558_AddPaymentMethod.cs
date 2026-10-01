using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GundamStoreApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentMethod : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 26, 9, 15, 56, 463, DateTimeKind.Local).AddTicks(1113), "AQAAAAIAAYagAAAAEJNI0n+Tgqfv0fVUfzYPGHlR78EIEO2YQG9e1bLscsC9CPDgIsEuxraxipIug3Xhpw==" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "Orders");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 24, 14, 53, 36, 301, DateTimeKind.Local).AddTicks(7543), "AQAAAAIAAYagAAAAEBytZZJU8RtO/C9UoPx+zWe+qNZTyMlBmtMG+ikpAMdeetRLNF4numwACWR1ORIluA==" });
        }
    }
}
