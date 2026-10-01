using System.ComponentModel.DataAnnotations;

namespace GundamStoreApi.DTOs;

public class AddressDto
{
    [Required(ErrorMessage = "Họ tên người nhận là bắt buộc")]
    public string ReceiverName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
    [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tỉnh/Thành phố là bắt buộc")]
    public string Province { get; set; } = string.Empty;

    [Required(ErrorMessage = "Quận/Huyện là bắt buộc")]
    public string District { get; set; } = string.Empty;

    [Required(ErrorMessage = "Phường/Xã là bắt buộc")]
    public string Ward { get; set; } = string.Empty;

    [Required(ErrorMessage = "Địa chỉ chi tiết là bắt buộc")]
    public string DetailedAddress { get; set; } = string.Empty;

    public bool? IsDefault { get; set; }
}
