using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DocumentDmsServer.Services;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserDb _db;
    private readonly IConfiguration _config;

    public AuthController(UserDb db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest req)
    {
        var user = _db.GetUserByUsername(req.Username ?? string.Empty);
        if (user == null)
        {
            Console.WriteLine("User not found: " + req.Username);
            return Unauthorized();
        }
        if (!BCrypt.Net.BCrypt.Verify(req.Password ?? string.Empty, user.PasswordHash))
        {
            Console.WriteLine("Password mismatch for user: " + req.Username);
            return Unauthorized();
        }

        // Get user with roles
        var userWithRoles = _db.GetUserWithRoles(user.Id);
        var roles = userWithRoles?.Roles ?? new List<Role>();
        
        // Create claims including all roles
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim("UserId", user.Id.ToString())
        };
        
        // Add legacy single role claim for backward compatibility
        claims.Add(new Claim(ClaimTypes.Role, user.Role));
        
        // Add all roles as individual claims
        foreach (var role in roles)
        {
            claims.Add(new Claim("roles", role.Name));
        }

        var keyString = _config["Jwt:Key"] ?? throw new Exception("JWT Key is not configured.");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddHours(8),
            signingCredentials: creds
        );
        
        // Determine if user is admin (legacy check or new role-based check)
        bool isAdmin = user.Role == "admin" || user.Role == "superadmin" || 
                      roles.Any(r => r.Name == "admin" || r.Name == "superadmin");
        
        return Ok(new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token),
            user = new { user.Id, user.Username, isAdmin, roles = roles.Select(r => r.Name).ToArray() }
        });
    }

    public class LoginRequest
    {
        public string? Username { get; set; }
        public string? Password { get; set; }
    }
}