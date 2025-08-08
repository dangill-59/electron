public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    
    // Legacy role field - kept for backward compatibility during migration
    public string Role { get; set; } = string.Empty;
    
    // New many-to-many relationship with roles
    public List<Role> Roles { get; set; } = new List<Role>();
}