public class UserRole
{
    public int UserId { get; set; }
    public int RoleId { get; set; }
}

public class RoleProject
{
    public int RoleId { get; set; }
    public int ProjectId { get; set; }
}

public class UserRoleAssignmentRequest
{
    public int UserId { get; set; }
    public List<int> RoleIds { get; set; } = new List<int>();
}

public class RoleProjectAssignmentRequest
{
    public int RoleId { get; set; }
    public List<int> ProjectIds { get; set; } = new List<int>();
}