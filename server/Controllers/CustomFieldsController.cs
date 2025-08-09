using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DocumentDmsServer.Services;

[ApiController]
[Route("api/projects/{projectId}/custom-fields")]
[Authorize(Roles = "admin")]
public class CustomFieldsController : ControllerBase
{
    private readonly CustomFieldDb _customFieldDb;

    public CustomFieldsController(CustomFieldDb customFieldDb)
    {
        _customFieldDb = customFieldDb;
    }

    [HttpGet]
    public IActionResult GetCustomFields(int projectId)
    {
        var customFields = _customFieldDb.GetCustomFieldsByProject(projectId);
        return Ok(customFields);
    }

    [HttpPost]
    public IActionResult CreateCustomField(int projectId, [FromBody] CreateCustomFieldRequest request)
    {
        var id = _customFieldDb.AddCustomField(projectId, request.Name, request.Type, request.Options);
        return Ok(new { id });
    }

    [HttpDelete("{customFieldId}")]
    public IActionResult DeleteCustomField(int projectId, int customFieldId)
    {
        _customFieldDb.DeleteCustomField(customFieldId);
        return Ok();
    }
}

public class CreateCustomFieldRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? Options { get; set; }
}