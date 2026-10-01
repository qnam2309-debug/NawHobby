using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using GundamStoreApi.Data;
using GundamStoreApi.Models;
using Google.Apis.Auth;
using GundamStoreApi.DTOs;
using Microsoft.AspNetCore.Identity; 

namespace GundamStoreApi.Controllers;


[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    // Khởi tạo PasswordHasher để dùng chung cho cả Register và Login
    private readonly PasswordHasher<User> _passwordHasher = new PasswordHasher<User>();

    public AuthController(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            return BadRequest("Email đã tồn tại");

        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Role = "User",
            CreatedAt = DateTime.UtcNow
        };

        // ĐÃ THAY ĐỔI: Dùng PasswordHasher để Hash mật khẩu
        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đăng ký thành công!", userId = user.Id });
    }

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
    {
        try 
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken);
            
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);
            if (user == null)
            {
                // Create new user
                user = new User
                {
                    FullName = payload.Name ?? payload.Email.Split('@')[0],
                    Email = payload.Email,
                    Role = "User",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }
            
            // Generate JWT same as login
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };
            
            var jwtKey = _config["Jwt:Key"];
            if (string.IsNullOrEmpty(jwtKey)) return StatusCode(500, "JWT Key missing");
            
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            
            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: creds
            );
            
            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
            
            return Ok(new LoginResponseDto
            {
                Token = tokenString,
                User = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Role = user.Role
                }
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Invalid Google token: {ex.Message}");
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        
        // ĐÃ THAY ĐỔI: Dùng VerifyHashedPassword thay vì BCrypt.Verify
        if (user == null)
            return BadRequest("Thông tin đăng nhập không hợp lệ");



        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);

        if (result == PasswordVerificationResult.Failed)
            return BadRequest("Thông tin đăng nhập không hợp lệ");

        // --- Giữ nguyên logic tạo Token bên dưới ---
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var jwtKey = _config["Jwt:Key"];
        if (string.IsNullOrEmpty(jwtKey)) return StatusCode(500, "JWT Key is missing in configuration");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddHours(1),
            signingCredentials: creds
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return Ok(new LoginResponseDto
        {
            Token = tokenString,
            User = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role
            }
        });
    }
}