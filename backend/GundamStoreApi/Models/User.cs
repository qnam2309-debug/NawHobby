using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using GundamStoreApi.Models;

namespace GundamStoreApi.Models;

public class User
{
    public int Id { get; set; }
    [Required]
    public string FullName { get; set; } = string.Empty;
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
    [Required]
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "User"; // User, Admin
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Address> Addresses { get; set; } = new List<Address>();
}

