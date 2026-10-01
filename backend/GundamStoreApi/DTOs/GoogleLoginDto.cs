using System.ComponentModel.DataAnnotations;

namespace GundamStoreApi.DTOs;

public class GoogleLoginDto
{
    [Required]
    public string IdToken { get; set; } = string.Empty;
}

