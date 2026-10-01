using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using GundamStoreApi.Data;
using GundamStoreApi.Models;
using GundamStoreApi.DTOs;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace GundamStoreApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrdersController(AppDbContext context)
        {
            _context = context;
        }
        // Thêm hàm này để Frontend kiểm tra trạng thái thanh toán tự động
        [HttpGet("check-status/{id}")]
        [AllowAnonymous] 
        public async Task<IActionResult> CheckStatus(int id)
        {
            var order = await _context.Orders
                .Select(o => new { o.Id, o.IsPaid, o.Status })
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return NotFound();

            return Ok(new { isPaid = order.IsPaid, status = order.Status });
        }
        [HttpPost]
        public async Task<ActionResult> CreateOrder([FromBody] CreateOrderDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdString, out int userId))
                return Unauthorized(new { message = "Invalid user" });

            if (!dto.Items.Any())
                return BadRequest(new { message = "Order items cannot be empty" });

            var productsDict = new Dictionary<int, Product>();
            foreach (var item in dto.Items)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product == null || product.Stock < item.Quantity)
                    return BadRequest(new { message = $"Sản phẩm không đủ hàng." });

                productsDict[item.ProductId] = product;
            }

            decimal totalAmount = 0;
            var orderDetails = new List<OrderDetail>();
            foreach (var item in dto.Items)
            {
                var product = productsDict[item.ProductId];
                var detail = new OrderDetail
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    Price = product.Price 
                };
                orderDetails.Add(detail);
                totalAmount += product.Price * item.Quantity;
            }

            var order = new Order
            {
                UserId = userId,
                CustomerName = dto.CustomerName,
                Phone = dto.Phone,
                ShippingAddress = dto.ShippingAddress,
                PaymentMethod = dto.PaymentMethod ?? "COD",
                TotalAmount = totalAmount,
                // Tạo mã đơn hàng duy nhất để khách chuyển khoản (VD: NAW240403123)
                OrderCode = "NAW" + DateTime.Now.ToString("yyMMdd") + new Random().Next(100, 999).ToString(),
                Status = (dto.PaymentMethod ?? "COD").ToUpper() == "SEPAY" ? "Pending Payment" : "Processing",
                IsPaid = false,
                OrderDate = DateTime.UtcNow,
                OrderDetails = orderDetails
            };

            using var transaction = await _context.Database.BeginTransactionAsync();
            try 
            {
                _context.Orders.Add(order);
                foreach (var kvp in productsDict)
                {
                    kvp.Value.Stock -= dto.Items.First(i => i.ProductId == kvp.Key).Quantity;
                    _context.Products.Update(kvp.Value);
                }
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }

            // Trả về thêm OrderCode và TotalAmount để Frontend hiển thị QR
            return Ok(new { 
                message = "Order created!", 
                orderId = order.Id, 
                orderCode = order.OrderCode,
                totalAmount = order.TotalAmount
            });
        }

        // --- ENDPOINT DÀNH CHO SEPAY (WEBHOOK) ---
 [HttpPost("sepay-webhook")]
[AllowAnonymous] 
public async Task<IActionResult> SepayWebhook([FromBody] SepayWebhookDto data)
{
    if (data == null || string.IsNullOrEmpty(data.content))
        return BadRequest();

    // 1. Chuẩn hóa nội dung chuyển khoản để tìm mã NAW...
    string bankContent = data.content.ToUpper().Trim();

    // 2. Tìm đơn hàng: Extract NAW12 codes from bankContent và match exact
    var nawCandidates = Regex.Matches(bankContent, @"NAW\d{9}")
        .Select(m => m.Value.ToUpper())
        .ToList();
    var order = await _context.Orders
        .FirstOrDefaultAsync(o => nawCandidates.Contains(o.OrderCode.ToUpper()) && !o.IsPaid);

    if (order != null)
    {
        // 3. SO SÁNH ABSOLUTE bằng cents (int)
        int receivedCents = (int)(data.transferAmount * 100);
        int requiredCents = (int)(order.TotalAmount * 100);
        Console.WriteLine($"--- Webhook Debug: {receivedCents} vs {requiredCents} ---");
        
        if (receivedCents >= requiredCents)
        {
            order.IsPaid = true;
            order.Status = "Processing"; 
            
            await _context.SaveChangesAsync();
            
            return Ok(new { success = true, message = "Thanh toan hop le" });
        }
    }

    return Ok(new { success = false, message = "Khong tim thay don hang hoac sai so tien" });
}
        [HttpGet("my-orders")]
        public async Task<ActionResult> GetUserOrders()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdString, out int userId))
                return Unauthorized();

            var orders = await _context.Orders
                .Include(o => o.OrderDetails)
                .ThenInclude(d => d.Product)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new {
                    o.Id,
                    o.OrderCode,
                    o.OrderDate,
                    o.TotalAmount,
                    o.Status,
                    o.IsPaid,
                    o.PaymentMethod,
                    RecipientName = o.CustomerName,
                    RecipientPhone = o.Phone,
                    o.ShippingAddress,
                    Items = o.OrderDetails.Select(d => new {
                        ProductName = d.Product.Name,
                        ProductImage = string.IsNullOrEmpty(d.Product.ImageUrl) 
                            ? "https://placehold.co/200x200?text=No+Image" 
                            : $"http://localhost:5134/{d.Product.ImageUrl.TrimStart('/')}",
                        d.Quantity,
                        d.Price
                    })
                })
                .ToListAsync();

            return Ok(orders);
        }

        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetAllOrders()
        {
            var orders = await _context.Orders
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new {
                    Id = o.Id,
                    OrderCode = o.OrderCode,
                    OrderDate = o.OrderDate,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status,
                    IsPaid = o.IsPaid,
                    PaymentMethod = o.PaymentMethod,
                    CustomerName = o.CustomerName,
                    Phone = o.Phone
                })
                .ToListAsync();

            return Ok(orders);
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto dto)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
                return NotFound();

            order.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Updated" });
        }
    }

    // DTO để hứng dữ liệu từ SePay gửi sang
    public class SepayWebhookDto
    {
        public string content { get; set; } = string.Empty; // Nội dung CK
        public decimal transferAmount { get; set; } // Số tiền nhận được
        public string transactionDate { get; set; } = string.Empty;
    }

    public class UpdateOrderStatusDto 
    { 
        public string Status { get; set; } = string.Empty; 
    } 
}

    