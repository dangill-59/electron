using Microsoft.AspNetCore.Mvc;
using DocumentDmsServer.Services;
using System.IO;

[ApiController]
[Route("[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly DocumentDb _db;
    private readonly CustomFieldDb _customFieldDb;

    public DocumentsController(DocumentDb db, CustomFieldDb customFieldDb)
    {
        _db = db;
        _customFieldDb = customFieldDb;
    }

    [HttpGet]
    public IActionResult List()
    {
        return Ok(_db.GetDocuments());
    }

    [HttpGet("{id}")]
    public IActionResult Get(int id)
    {
        var doc = _db.GetDocument(id);
        if (doc == null)
            return NotFound();
        return Ok(doc);
    }

    [HttpGet("download/{id}")]
    public IActionResult Download(int id)
    {
        var doc = _db.GetDocument(id);
        if (doc == null)
            return NotFound();
        var path = _db.GetUploadPath(doc.Filename ?? "");
        if (!System.IO.File.Exists(path))
            return NotFound();
        return PhysicalFile(path, "application/octet-stream", doc.Filename ?? "document");
    }

    [HttpPost("upload")]
    public IActionResult Upload([FromForm] string title, [FromForm] string description, [FromForm] string owner, [FromForm] IFormFile file, [FromForm] int? projectId, [FromForm] string? customFieldValues)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File missing");

        var filename = Path.GetFileName(file.FileName);
        var uploadPath = _db.GetUploadPath(filename);
        using var stream = new FileStream(uploadPath, FileMode.Create);
        file.CopyTo(stream);

        var id = _db.AddDocument(title, description, filename, owner, projectId);

        // Handle custom field values if provided
        if (projectId.HasValue && !string.IsNullOrEmpty(customFieldValues))
        {
            try
            {
                var customFieldDict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<int, string>>(customFieldValues);
                if (customFieldDict != null)
                {
                    foreach (var kvp in customFieldDict)
                    {
                        _customFieldDb.SaveCustomFieldValue(id, projectId.Value, kvp.Key, kvp.Value);
                    }
                }
            }
            catch (Exception ex)
            {
                // Log error but don't fail the upload
                Console.WriteLine($"Error saving custom field values: {ex.Message}");
            }
        }

        return Ok(new { id });
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        _db.DeleteDocument(id);
        return Ok();
    }

    [HttpGet("search")]
    public IActionResult SearchByCustomField([FromQuery] int projectId, [FromQuery] int customFieldId, [FromQuery] string searchValue)
    {
        var documents = _customFieldDb.SearchDocumentsByCustomField(projectId, customFieldId, searchValue);
        return Ok(documents);
    }
}