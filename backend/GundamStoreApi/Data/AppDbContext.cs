using Microsoft.EntityFrameworkCore;
using GundamStoreApi.Models;
using Microsoft.AspNetCore.Identity;

namespace GundamStoreApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<CartItem> CartItems { get; set; } = null!;
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<OrderDetail> OrderDetails { get; set; } = null!;
    public DbSet<Address> Addresses { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)

    {
        base.OnModelCreating(modelBuilder);

        // 1. Cấu hình Decimal (Hết lỗi Warning)
        modelBuilder.Entity<Product>()
            .Property(p => p.Price)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<Order>()
            .Property(o => o.TotalAmount)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<OrderDetail>()
            .Property(od => od.Price)
            .HasColumnType("decimal(18,2)");

        // 2. Ràng buộc Product & User
        modelBuilder.Entity<Product>()
            .Property(p => p.Category)
            .HasMaxLength(10);

        modelBuilder.Entity<User>()
            .Property(u => u.Role)
            .HasMaxLength(20);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<CartItem>()
            .HasKey(ci => new { ci.UserId, ci.ProductId });

        // 3. Quan hệ bảng
        modelBuilder.Entity<OrderDetail>()
            .HasOne(od => od.Order)
            .WithMany(o => o.OrderDetails)
            .HasForeignKey(od => od.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderDetail>()
            .HasOne(od => od.Product)
            .WithMany()
            .HasForeignKey(od => od.ProductId);

        // Address configurations
        modelBuilder.Entity<Address>()
            .Property(a => a.ReceiverName)
            .HasMaxLength(100);

        modelBuilder.Entity<Address>()
            .Property(a => a.PhoneNumber)
            .HasMaxLength(20);

        modelBuilder.Entity<Address>()
            .Property(a => a.Province)
            .HasMaxLength(100);

        modelBuilder.Entity<Address>()
            .Property(a => a.District)
            .HasMaxLength(100);

        modelBuilder.Entity<Address>()
            .Property(a => a.Ward)
            .HasMaxLength(100);

        modelBuilder.Entity<Address>()
            .Property(a => a.DetailedAddress)
            .HasMaxLength(500);

        // Address relationship
        modelBuilder.Entity<Address>()
            .HasOne(a => a.User)
            .WithMany(u => u.Addresses)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Address>()
            .HasIndex(a => new { a.UserId, a.IsDefault });

        // Chạy Seed Data
        SeedData(modelBuilder);

    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        // Đã xóa phần Seed cho Products

        // Giữ lại Seed cho tài khoản Admin
        var hasher = new PasswordHasher<User>();
        
        modelBuilder.Entity<User>().HasData(
            new User 
            { 
                Id = 1, 
                FullName = "admin", 
                Email = "admin@hobby.com", 
                PasswordHash = hasher.HashPassword(null!, "admin123"),
                Role = "Admin",
                CreatedAt = DateTime.Now
            }
        );
    }
}