using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DocumentDmsServer.Services;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "admin,superadmin")]
public class UsersController : ControllerBase
{
    private readonly UserDb _db;
    private readonly RoleDb _roleDb;
    
    public UsersController(UserDb db, RoleDb roleDb) 
    { 
        _db = db; 
        _roleDb = roleDb;
    }

    [HttpGet]
    public IActionResult GetAll() => Ok(_db.GetUsers());

    [HttpPost]
    public IActionResult Create([FromBody] UserCreateModel model)
    {
        _db.AddUser(model.Username ?? string.Empty, model.Password ?? string.Empty, model.Role ?? "user");
        return Ok();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        _db.DeleteUser(id);
        return Ok();
    }

    // New endpoints for role assignments

    [HttpGet("{userId}/roles")]
    public IActionResult GetUserRoles(int userId)
    {
        var roles = _db.GetUserRoles(userId);
        return Ok(roles);
    }

    [HttpPost("{userId}/roles")]
    public IActionResult AssignRolesToUser(int userId, [FromBody] UserRoleAssignmentRequest request)
    {
        _db.AssignRolesToUser(userId, request.RoleIds);
        return Ok();
    }

    [HttpPost("{userId}/roles/{roleId}")]
    public IActionResult AddRoleToUser(int userId, int roleId)
    {
        _db.AddRoleToUser(userId, roleId);
        return Ok();
    }

    [HttpDelete("{userId}/roles/{roleId}")]
    public IActionResult RemoveRoleFromUser(int userId, int roleId)
    {
        _db.RemoveRoleFromUser(userId, roleId);
        return Ok();
    }

    public class UserCreateModel
    {
        public string? Username { get; set; }
        public string? Password { get; set; }
        public string? Role { get; set; }
    }
}