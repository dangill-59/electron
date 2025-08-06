using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DocumentDmsServer.Services;

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
}