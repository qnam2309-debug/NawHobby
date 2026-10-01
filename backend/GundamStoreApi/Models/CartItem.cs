using System.ComponentModel.DataAnnotations;

namespace GundamStoreApi.Models;

public class CartItem
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
}

