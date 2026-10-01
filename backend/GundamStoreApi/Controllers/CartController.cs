using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using GundamStoreApi.Data;
using GundamStoreApi.Models;
using GundamStoreApi.DTOs;
using System.Security.Claims;
using System.Text.Json;

namespace GundamStoreApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly AppDbContext _context;

    public CartController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> GetCart()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdString, out int userId))
            return Unauthorized();

        var cartItems = await _context.CartItems
            .Where(ci => ci.UserId == userId)
            .Include(ci => ci.Product)
            .ToListAsync();

        var response = cartItems.Select(ci => new
        {
            productId = ci.ProductId,
            productName = ci.Product.Name,
            price = ci.Product.Price,
            quantity = ci.Quantity,
            total = ci.Product.Price * ci.Quantity
        }).ToList();

        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> AddOrUpdateCart([FromBody] CartItemDto dto)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdString, out int userId))
            return Unauthorized();

        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null) return NotFound("Product not found");

        var cartItem = await _context.CartItems
            .FirstOrDefaultAsync(ci => ci.UserId == userId && ci.ProductId == dto.ProductId);

        if (cartItem == null)
        {
            cartItem = new CartItem
            {
                UserId = userId,
                ProductId = dto.ProductId,
                Quantity = dto.Quantity
            };
            _context.CartItems.Add(cartItem);
        }
        else
        {
            cartItem.Quantity = dto.Quantity;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Cart updated" });
    }

    [HttpDelete("{productId}")]
    public async Task<IActionResult> RemoveFromCart(int productId)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdString, out int userId))
            return Unauthorized();

        var cartItem = await _context.CartItems
            .FirstOrDefaultAsync(ci => ci.UserId == userId && ci.ProductId == productId);

        if (cartItem == null) return NotFound();

        _context.CartItems.Remove(cartItem);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Item removed from cart" });
    }
}

