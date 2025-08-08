using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DocumentDmsServer.Services;

[ApiController]
[Route("api/roles")]
[Authorize(Roles = "admin,superadmin")]
public class RolesController : ControllerBase
{
    private readonly RoleDb _db;
    public RolesController(RoleDb db) { _db = db; }

    [HttpGet]
    public IActionResult GetAll() => Ok(_db.GetRoles());

    [HttpPost]
    public IActionResult Create([FromBody] RoleCreateModel model)
    {
        _db.AddRole(model.Name ?? string.Empty);
        return Ok();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        _db.DeleteRole(id);
        return Ok();
    }

    // New endpoints for role-project assignments

    [HttpGet("{roleId}/projects")]
    public IActionResult GetRoleProjects(int roleId)
    {
        var projectIds = _db.GetRoleProjects(roleId);
        return Ok(projectIds);
    }

    [HttpPost("{roleId}/projects")]
    public IActionResult AssignProjectsToRole(int roleId, [FromBody] RoleProjectAssignmentRequest request)
    {
        _db.AssignProjectsToRole(roleId, request.ProjectIds);
        return Ok();
    }

    [HttpPost("{roleId}/projects/{projectId}")]
    public IActionResult AddProjectToRole(int roleId, int projectId)
    {
        _db.AddProjectToRole(roleId, projectId);
        return Ok();
    }

    [HttpDelete("{roleId}/projects/{projectId}")]
    public IActionResult RemoveProjectFromRole(int roleId, int projectId)
    {
        _db.RemoveProjectFromRole(roleId, projectId);
        return Ok();
    }

    public class RoleCreateModel
    {
        public string? Name { get; set; }
    }
}