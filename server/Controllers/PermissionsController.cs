using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DocumentDmsServer.Services;

[ApiController]
[Route("api/permissions")]
[Authorize]
public class PermissionsController : ControllerBase
{
    private readonly UserDb _userDb;
    
    public PermissionsController(UserDb userDb)
    {
        _userDb = userDb;
    }

    [HttpGet("check")]
    public IActionResult CheckPermission([FromQuery] int userId, [FromQuery] string role, [FromQuery] int? projectId)
    {
        bool hasPermission = false;

        if (projectId.HasValue)
        {
            // Check if user has role for specific project
            hasPermission = _userDb.UserHasRoleForProject(userId, role, projectId.Value);
        }
        else
        {
            // Check if user has role regardless of project
            hasPermission = _userDb.UserHasRole(userId, role);
        }

        // Special case: superadmin bypasses project restrictions
        if (!hasPermission && role != "superadmin")
        {
            hasPermission = _userDb.UserHasRole(userId, "superadmin");
        }

        return Ok(new { hasPermission, userId, role, projectId });
    }

    [HttpGet("user/{userId}")]
    public IActionResult GetUserPermissions(int userId)
    {
        var user = _userDb.GetUserWithRoles(userId);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(new 
        { 
            userId = user.Id,
            username = user.Username,
            legacyRole = user.Role,
            roles = user.Roles.Select(r => r.Name).ToArray()
        });
    }
}