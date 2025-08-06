using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DocumentDmsServer.Services;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "admin")]
public class UsersController : ControllerBase
{
    private readonly UserDb _db;
    public UsersController(UserDb db) { _db = db; }

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

    public class UserCreateModel
    {
        public string? Username { get; set; }
        public string? Password { get; set; }
        public string? Role { get; set; }
    }
}