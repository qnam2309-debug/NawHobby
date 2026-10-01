using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.IO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GundamStoreApi.Data;
using GundamStoreApi.Models;
using Microsoft.AspNetCore.Hosting;

namespace GundamStoreApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public ProductsController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    // 1. LẤY TOÀN BỘ SẢN PHẨM
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
    {
        return await _context.Products.ToListAsync();
    }

    // 2. LẤY SẢN PHẨM NỔI BẬT (Fix lỗi Featured load error)
    // Lưu ý: Phải đặt Route này TRƯỚC Route {id} để tránh bị nhầm lẫn là ID
    [HttpGet("featured")]
    public async Task<ActionResult<IEnumerable<Product>>> GetFeaturedProducts()
    {
        // Lấy 4 sản phẩm mới nhất còn hàng (Stock > 0)
        return await _context.Products
            .Where(p => p.Stock > 0)
            .OrderByDescending(p => p.CreatedAt)
            .Take(4)
            .ToListAsync();
    }

    // 3. LẤY CHI TIẾT 1 SẢN PHẨM THEO ID
    [HttpGet("{id}")]
    public async Task<ActionResult<Product>> GetProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();
        return product;
    }

    // 4. CẬP NHẬT KHO (Dùng cho inventory.js)
    [HttpPut("stock/{id}")] 
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStock(int id, [FromBody] StockUpdateDto model)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound(new { message = "Sản phẩm không tồn tại" });

        product.Stock = model.Stock;

        try
        {
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công", stock = product.Stock });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi hệ thống", details = ex.Message });
        }
    }

    // 5. CẬP NHẬT TOÀN BỘ THÔNG TIN (Dùng cho trang Edit)
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateProduct(int id, [FromForm] Product product, IFormFile? image)
    {
        var existingProduct = await _context.Products.FindAsync(id);
        if (existingProduct == null) return NotFound();

        existingProduct.Name = product.Name;
        existingProduct.Description = product.Description;
        existingProduct.Price = product.Price;
        existingProduct.Stock = product.Stock;
        existingProduct.Category = product.Category;

        if (image != null && image.Length > 0)
        {
            // Xóa ảnh cũ nếu có
            if (!string.IsNullOrEmpty(existingProduct.ImageUrl) && existingProduct.ImageUrl.StartsWith("/images/products/"))
            {
                var oldFilePath = Path.Combine(_env.WebRootPath, existingProduct.ImageUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldFilePath)) System.IO.File.Delete(oldFilePath);
            }
            
            var uploadsDir = Path.Combine(_env.WebRootPath, "images", "products");
            Directory.CreateDirectory(uploadsDir);
            var uniqueFileName = Guid.NewGuid().ToString() + "_" + Path.GetExtension(image.FileName);
            var filePath = Path.Combine(uploadsDir, uniqueFileName);
            
            using (var fileStream = new FileStream(filePath, FileMode.Create)) 
            { 
                await image.CopyToAsync(fileStream); 
            }
            existingProduct.ImageUrl = "/images/products/" + uniqueFileName;
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // 6. THÊM MỚI SẢN PHẨM
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Product>> CreateProduct([FromForm] Product product, IFormFile? image)
    {
        string imageUrl = "";
        if (image != null && image.Length > 0)
        {
            var uploadsDir = Path.Combine(_env.WebRootPath, "images", "products");
            Directory.CreateDirectory(uploadsDir);
            var uniqueFileName = Guid.NewGuid().ToString() + "_" + Path.GetExtension(image.FileName);
            var filePath = Path.Combine(uploadsDir, uniqueFileName);
            
            using (var fileStream = new FileStream(filePath, FileMode.Create)) 
            { 
                await image.CopyToAsync(fileStream); 
            }
            imageUrl = "/images/products/" + uniqueFileName;
        }
        
        product.ImageUrl = imageUrl;
        product.CreatedAt = DateTime.UtcNow;
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
    }

    // 7. XÓA SẢN PHẨM
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        if (!string.IsNullOrEmpty(product.ImageUrl) && product.ImageUrl.StartsWith("/images/products/"))
        {
            var filePath = Path.Combine(_env.WebRootPath, product.ImageUrl.TrimStart('/'));
            if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

// DTO dùng riêng cho cập nhật nhanh số lượng tồn kho
public class StockUpdateDto
{
    public int Stock { get; set; }
}