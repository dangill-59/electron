public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    
    // Projects this role has access to
    public List<int> ProjectIds { get; set; } = new List<int>();
}