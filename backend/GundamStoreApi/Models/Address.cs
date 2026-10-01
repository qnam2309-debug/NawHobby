using System.ComponentModel.DataAnnotations;
using GundamStoreApi.Models;

namespace GundamStoreApi.Models;

public class Address
{
    public int Id { get; set; }
    
    public int UserId { get; set; }
    
    [Required]
    public string ReceiverName { get; set; } = string.Empty;
    
    [Required, Phone]
    public string PhoneNumber { get; set; } = string.Empty;
    
    [Required]
    public string Province { get; set; } = string.Empty;
    
    [Required]
    public string District { get; set; } = string.Empty;
    
    [Required]
    public string Ward { get; set; } = string.Empty;
    
    [Required]
    public string DetailedAddress { get; set; } = string.Empty;
    
    public bool IsDefault { get; set; } = false;
    
    // Navigation properties
    public User User { get; set; } = null!;
}
