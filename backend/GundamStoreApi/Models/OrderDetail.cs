using System.ComponentModel.DataAnnotations;

namespace GundamStoreApi.Models;

public class OrderDetail
{
    public int Id { get; set; }
    
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
    
    [Range(0, double.MaxValue)]
    public decimal Price { get; set; } // Price snapshot at order time
}

