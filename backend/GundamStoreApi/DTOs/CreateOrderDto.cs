namespace GundamStoreApi.DTOs;
using System.ComponentModel.DataAnnotations;
public class CreateOrderDto
{
    [Required]
    public string CustomerName { get; set; } = string.Empty;
    
    [Phone]
    public string Phone { get; set; } = string.Empty;
    
    [Required]
    public string ShippingAddress { get; set; } = string.Empty;
    
    [Required]
    public string PaymentMethod { get; set; } = string.Empty;
    
    public List<OrderItemDto> Items { get; set; } = new List<OrderItemDto>();
}

