using System.ComponentModel.DataAnnotations;

namespace GundamStoreApi.Models;

public class Product
{
    public int Id { get; set; }
    [Required]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    [Range(0, int.MaxValue)]
    public int Stock { get; set; }
    public string Category { get; set; } = "RG"; // RG, MG, PG, etc.
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

