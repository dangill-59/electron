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

    /// <summary>
    /// Deletes a user by ID. The permanent system admin user 'sa' cannot be deleted.
    /// </summary>
    /// <param name="id">The ID of the user to delete</param>
    /// <returns>OK if successful, BadRequest if attempting to delete system admin</returns>
    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        try
        {
            _db.DeleteUser(id);
            return Ok();
        }
        catch (InvalidOperationException ex)
        {
            // Handle attempt to delete the system admin user
            return BadRequest(new { message = ex.Message });
        }
    }

    public class UserCreateModel
    {
        public string? Username { get; set; }
        public string? Password { get; set; }
        public string? Role { get; set; }
    }
}