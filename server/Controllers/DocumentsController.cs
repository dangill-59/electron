using Microsoft.AspNetCore.Mvc;
using System.IO;

[ApiController]
[Route("[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly DocumentDb _db;

    public DocumentsController(DocumentDb db)
    {
        _db = db;
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
    public IActionResult Upload([FromForm] string title, [FromForm] string description, [FromForm] string owner, [FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File missing");

        var filename = Path.GetFileName(file.FileName);
        var uploadPath = _db.GetUploadPath(filename);
        using var stream = new FileStream(uploadPath, FileMode.Create);
        file.CopyTo(stream);

        var id = _db.AddDocument(title, description, filename, owner);
        return Ok(new { id });
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        _db.DeleteDocument(id);
        return Ok();
    }
}