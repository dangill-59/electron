using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DocumentDmsServer.Services;

[ApiController]
[Route("api/roles")]
[Authorize(Roles = "admin")]
public class RolesController : ControllerBase
{
    private readonly RoleDb _db;
    public RolesController(RoleDb db) { _db = db; }

    [HttpGet]
    public IActionResult GetAll() => Ok(_db.GetRoles());
}