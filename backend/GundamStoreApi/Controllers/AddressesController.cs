using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GundamStoreApi.Data;
using GundamStoreApi.DTOs;
using GundamStoreApi.Models;
using System.Security.Claims;

namespace GundamStoreApi.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AddressesController : ControllerBase
{
    private readonly AppDbContext _context;

    public AddressesController(AppDbContext context)
    {
        _context = context;
    }

    private int GetCurrentUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdString, out int userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token.");
        }
        return userId;
    }

    // GET: api/addresses
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Address>>> GetMyAddresses()
    {
        var userId = GetCurrentUserId();
        var addresses = await _context.Addresses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ThenBy(a => a.Id)
            .ToListAsync();
        return Ok(addresses);
    }

    // POST: api/addresses
    [HttpPost]
    public async Task<ActionResult<Address>> AddAddress([FromBody] AddressDto dto)
    {
        var userId = GetCurrentUserId();

        var address = new Address
        {
            UserId = userId,
            ReceiverName = dto.ReceiverName,
            PhoneNumber = dto.PhoneNumber,
            Province = dto.Province,
            District = dto.District,
            Ward = dto.Ward,
            DetailedAddress = dto.DetailedAddress,
            IsDefault = dto.IsDefault ?? false
        };

        // If setting as default or first address, reset others
        var shouldResetOthers = address.IsDefault || !_context.Addresses.Any(a => a.UserId == userId);
        if (shouldResetOthers)
        {
            var otherAddresses = _context.Addresses.Where(a => a.UserId == userId && a.Id != address.Id);
            foreach (var other in otherAddresses)
            {
                other.IsDefault = false;
            }
        }

        _context.Addresses.Add(address);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMyAddresses), new { id = address.Id }, address);
    }

    // PUT: api/addresses/{id}/default
    [HttpPut("{id}/default")]
    public async Task<IActionResult> SetDefault(int id)
    {
        var userId = GetCurrentUserId();

        var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (address == null)
        {
            return NotFound("Address not found or not owned by user.");
        }

        // Reset all other addresses of this user
        var otherAddresses = await _context.Addresses
            .Where(a => a.UserId == userId && a.Id != id)
            .ToListAsync();
        foreach (var other in otherAddresses)
        {
            other.IsDefault = false;
        }

        address.IsDefault = true;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/addresses/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAddress(int id)
    {
        var userId = GetCurrentUserId();

        var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (address == null)
        {
            return NotFound("Address not found or not owned by user.");
        }

        _context.Addresses.Remove(address);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
