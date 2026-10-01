using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using GundamStoreApi.Data;

var builder = WebApplication.CreateBuilder(args);

// --- 1. Cấu hình Services (DI Container) ---

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Authentication JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Cấu hình CORS (Định nghĩa chính sách để dùng ở dưới)
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", policy => {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader()
              .WithExposedHeaders("X-Pagination");
    });
    
});

var app = builder.Build();

// --- Cấu hình Middleware (Thứ tự này là BẮT BUỘC để chạy được) ---

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "GundamStore API V1");
    });
}

// 1. CORS PHẢI ĐẶT TRƯỚC Authentication/Authorization và Controllers
app.UseCors("AllowAll");

app.UseStaticFiles();

// 2. Routing
app.UseRouting();

// 3. Auth
app.UseAuthentication();
app.UseAuthorization();

// 4. Map các Endpoint (Hàm xử lý)
app.MapControllers();

app.MapGet("/health", () => "API is running!");

// 5. Tự động Migrate (nếu cần)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // context.Database.Migrate(); 
}

// DÒNG NÀY PHẢI LUÔN LÀ DÒNG CUỐI CÙNG
app.Run();