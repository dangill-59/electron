using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DocumentDmsServer.Services;
using DocumentDmsServer.Models;

[ApiController]
[Route("api/projects")]
[Authorize(Roles = "admin")]
public class ProjectsController : ControllerBase
{
    private readonly ProjectDb _db;
    public ProjectsController(ProjectDb db) { _db = db; }

    [HttpGet]
    public IActionResult GetAll() => Ok(_db.GetProjects());

    [HttpPost]
    public IActionResult Create([FromBody] Project project)
    {
        _db.AddProject(project.Name ?? string.Empty);
        return Ok();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        _db.DeleteProject(id);
        return Ok();
    }

    // Project Fields endpoints
    [HttpGet("{projectId}/fields")]
    public IActionResult GetProjectFields(int projectId)
    {
        var fields = _db.GetProjectFields(projectId);
        return Ok(fields);
    }

    [HttpPost("{projectId}/fields")]
    public IActionResult CreateProjectField(int projectId, [FromBody] ProjectField field)
    {
        _db.AddProjectField(projectId, field.Name ?? string.Empty, field.Type ?? string.Empty, field.ListOptions);
        return Ok();
    }

    [HttpDelete("fields/{fieldId}")]
    public IActionResult DeleteProjectField(int fieldId)
    {
        _db.DeleteProjectField(fieldId);
        return Ok();
    }
}