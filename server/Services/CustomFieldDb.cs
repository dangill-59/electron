using Microsoft.Data.Sqlite;
using System.Collections.Generic;

namespace DocumentDmsServer.Services
{
    public class CustomFieldDb
    {
        private readonly string _connStr = "Data Source=documentdms.db";

        public CustomFieldDb()
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            
            // Create custom_fields table
            cmd.CommandText = @"CREATE TABLE IF NOT EXISTS custom_fields (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                project_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                options TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(project_id) REFERENCES projects(id)
            )";
            cmd.ExecuteNonQuery();

            // Create document_custom_field_values table
            cmd.CommandText = @"CREATE TABLE IF NOT EXISTS document_custom_field_values (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL,
                project_id INTEGER NOT NULL,
                custom_field_id INTEGER NOT NULL,
                value TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(document_id) REFERENCES documents(id),
                FOREIGN KEY(project_id) REFERENCES projects(id),
                FOREIGN KEY(custom_field_id) REFERENCES custom_fields(id)
            )";
            cmd.ExecuteNonQuery();

            // Add project_id column to documents table if it doesn't exist
            cmd.CommandText = @"PRAGMA table_info(documents)";
            using var reader = cmd.ExecuteReader();
            bool hasProjectId = false;
            while (reader.Read())
            {
                if (reader.GetString(1) == "project_id")
                {
                    hasProjectId = true;
                    break;
                }
            }
            reader.Close();

            if (!hasProjectId)
            {
                cmd.CommandText = @"ALTER TABLE documents ADD COLUMN project_id INTEGER";
                cmd.ExecuteNonQuery();
            }
        }

        public int AddCustomField(int projectId, string name, string type, string? options = null)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = @"INSERT INTO custom_fields (project_id, name, type, options, created_at) 
                               VALUES ($project_id, $name, $type, $options, $created_at); 
                               SELECT last_insert_rowid();";
            cmd.Parameters.AddWithValue("$project_id", projectId);
            cmd.Parameters.AddWithValue("$name", name);
            cmd.Parameters.AddWithValue("$type", type);
            cmd.Parameters.AddWithValue("$options", options ?? string.Empty);
            cmd.Parameters.AddWithValue("$created_at", DateTime.UtcNow.ToString("o"));
            var result = cmd.ExecuteScalar();
            return result != null ? (int)(long)result : 0;
        }

        public List<CustomField> GetCustomFieldsByProject(int projectId)
        {
            var list = new List<CustomField>();
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM custom_fields WHERE project_id = $project_id ORDER BY created_at";
            cmd.Parameters.AddWithValue("$project_id", projectId);
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new CustomField
                {
                    Id = reader.GetInt32(0),
                    ProjectId = reader.GetInt32(1),
                    Name = reader.GetString(2),
                    Type = reader.GetString(3),
                    Options = reader.IsDBNull(4) ? null : reader.GetString(4),
                    CreatedAt = DateTime.Parse(reader.GetString(5))
                });
            }
            return list;
        }

        public void DeleteCustomField(int id)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            
            // Delete related values first
            var cmd = conn.CreateCommand();
            cmd.CommandText = "DELETE FROM document_custom_field_values WHERE custom_field_id = $id";
            cmd.Parameters.AddWithValue("$id", id);
            cmd.ExecuteNonQuery();
            
            // Delete the custom field
            cmd.CommandText = "DELETE FROM custom_fields WHERE id = $id";
            cmd.ExecuteNonQuery();
        }

        public void SaveCustomFieldValue(int documentId, int projectId, int customFieldId, string value)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            
            // Check if value already exists and update, otherwise insert
            cmd.CommandText = @"INSERT OR REPLACE INTO document_custom_field_values 
                               (document_id, project_id, custom_field_id, value, created_at) 
                               VALUES ($document_id, $project_id, $custom_field_id, $value, $created_at)";
            cmd.Parameters.AddWithValue("$document_id", documentId);
            cmd.Parameters.AddWithValue("$project_id", projectId);
            cmd.Parameters.AddWithValue("$custom_field_id", customFieldId);
            cmd.Parameters.AddWithValue("$value", value);
            cmd.Parameters.AddWithValue("$created_at", DateTime.UtcNow.ToString("o"));
            cmd.ExecuteNonQuery();
        }

        public List<DocumentCustomFieldValue> GetCustomFieldValuesByDocument(int documentId)
        {
            var list = new List<DocumentCustomFieldValue>();
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM document_custom_field_values WHERE document_id = $document_id";
            cmd.Parameters.AddWithValue("$document_id", documentId);
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new DocumentCustomFieldValue
                {
                    Id = reader.GetInt32(0),
                    DocumentId = reader.GetInt32(1),
                    ProjectId = reader.GetInt32(2),
                    CustomFieldId = reader.GetInt32(3),
                    Value = reader.GetString(4),
                    CreatedAt = DateTime.Parse(reader.GetString(5))
                });
            }
            return list;
        }

        public List<Document> SearchDocumentsByCustomField(int projectId, int customFieldId, string searchValue)
        {
            var list = new List<Document>();
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = @"SELECT DISTINCT d.* FROM documents d 
                               INNER JOIN document_custom_field_values v ON d.id = v.document_id 
                               WHERE v.project_id = $project_id 
                               AND v.custom_field_id = $custom_field_id 
                               AND v.value LIKE $search_value";
            cmd.Parameters.AddWithValue("$project_id", projectId);
            cmd.Parameters.AddWithValue("$custom_field_id", customFieldId);
            cmd.Parameters.AddWithValue("$search_value", $"%{searchValue}%");
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new Document
                {
                    Id = reader.GetInt32(0),
                    Title = reader.IsDBNull(1) ? null : reader.GetString(1),
                    Description = reader.IsDBNull(2) ? null : reader.GetString(2),
                    Filename = reader.IsDBNull(3) ? null : reader.GetString(3),
                    Owner = reader.IsDBNull(4) ? null : reader.GetString(4),
                    ProjectId = reader.IsDBNull(5) ? null : reader.GetInt32(5)
                });
            }
            return list;
        }
    }
}