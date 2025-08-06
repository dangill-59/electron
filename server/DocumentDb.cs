using Microsoft.Data.Sqlite;
using System.Collections.Generic;
using System.IO;

public class DocumentDb
{
    private readonly string _connStr = "Data Source=documentdms.db";
    private readonly string _uploadFolder = "uploads";

    public DocumentDb()
    {
        if (!Directory.Exists(_uploadFolder))
            Directory.CreateDirectory(_uploadFolder);

        using var conn = new SqliteConnection(_connStr);
        conn.Open();
        var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                description TEXT,
                filename TEXT,
                owner TEXT
            )";
        cmd.ExecuteNonQuery();
    }

    public int AddDocument(string title, string description, string filename, string owner)
    {
        using var conn = new SqliteConnection(_connStr);
        conn.Open();
        var cmd = conn.CreateCommand();
        cmd.CommandText = "INSERT INTO documents (title, description, filename, owner) VALUES ($title, $desc, $filename, $owner); SELECT last_insert_rowid();";
        cmd.Parameters.AddWithValue("$title", title);
        cmd.Parameters.AddWithValue("$desc", description);
        cmd.Parameters.AddWithValue("$filename", filename);
        cmd.Parameters.AddWithValue("$owner", owner);
        var result = cmd.ExecuteScalar();
        return result != null ? (int)(long)result : 0;
    }

    public List<Document> GetDocuments()
    {
        var list = new List<Document>();
        using var conn = new SqliteConnection(_connStr);
        conn.Open();
        var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM documents";
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            list.Add(new Document
            {
                Id = reader.GetInt32(0),
                Title = reader.IsDBNull(1) ? null : reader.GetString(1),
                Description = reader.IsDBNull(2) ? null : reader.GetString(2),
                Filename = reader.IsDBNull(3) ? null : reader.GetString(3),
                Owner = reader.IsDBNull(4) ? null : reader.GetString(4)
            });
        }
        return list;
    }

    public Document? GetDocument(int id)
    {
        using var conn = new SqliteConnection(_connStr);
        conn.Open();
        var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM documents WHERE id = $id";
        cmd.Parameters.AddWithValue("$id", id);
        using var reader = cmd.ExecuteReader();
        if (reader.Read())
        {
            return new Document
            {
                Id = reader.GetInt32(0),
                Title = reader.IsDBNull(1) ? null : reader.GetString(1),
                Description = reader.IsDBNull(2) ? null : reader.GetString(2),
                Filename = reader.IsDBNull(3) ? null : reader.GetString(3),
                Owner = reader.IsDBNull(4) ? null : reader.GetString(4)
            };
        }
        return null;
    }

    public void DeleteDocument(int id)
    {
        var doc = GetDocument(id);
        if (doc != null)
        {
            var filePath = Path.Combine(_uploadFolder, doc.Filename ?? "");
            if (File.Exists(filePath))
                File.Delete(filePath);

            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "DELETE FROM documents WHERE id = $id";
            cmd.Parameters.AddWithValue("$id", id);
            cmd.ExecuteNonQuery();
        }
    }

    public string GetUploadPath(string filename) => Path.Combine(_uploadFolder, filename);
}

public class Document
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Filename { get; set; }
    public string? Owner { get; set; }
}