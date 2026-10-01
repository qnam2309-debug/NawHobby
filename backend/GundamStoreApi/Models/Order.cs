using System.ComponentModel.DataAnnotations;

namespace GundamStoreApi.Models;

public class Order
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    
    [Range(0, double.MaxValue)]
    public decimal TotalAmount { get; set; }
    
    public string Status { get; set; } = "Pending"; // Pending Payment, Processing, Shipped, Delivered
    
    [Required]
    public string CustomerName { get; set; } = string.Empty;
    
    public string PaymentMethod { get; set; } = string.Empty; // "COD", "SEPAY"
    
    // Thêm 2 trường này để phục vụ SePay
    public bool IsPaid { get; set; } = false;
    public string OrderCode { get; set; } = string.Empty; // Ví dụ: NAW12345
    
    [Phone]
    public string Phone { get; set; } = string.Empty;
    
    public string? ShippingAddress { get; set; }
    
    public ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
} // Dấu đóng này phải nằm cuối cùng