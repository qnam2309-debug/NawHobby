using Microsoft.AspNetCore.Identity;

class Program
{
    static void Main()
    {
        string password = "admin123";
        var hasher = new PasswordHasher<object>();
        string hash = hasher.HashPassword(null!, password);
        Console.WriteLine($"Hash for '{password}':");
        Console.WriteLine(hash);
    }
}
