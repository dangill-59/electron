using Microsoft.Data.Sqlite;
using System.Collections.Generic;
using DocumentDmsServer.Models;

namespace DocumentDmsServer.Services
{
    public class ProjectDb
    {
        private readonly string _connStr = "Data Source=documentdms.db";
        public ProjectDb()
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = @"CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                name TEXT)";
            cmd.ExecuteNonQuery();

            // Create project_fields table
            cmd.CommandText = @"CREATE TABLE IF NOT EXISTS project_fields (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                list_options TEXT,
                FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE)";
            cmd.ExecuteNonQuery();
        }

        public void AddProject(string name)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "INSERT INTO projects (name) VALUES ($name)";
            cmd.Parameters.AddWithValue("$name", name);
            cmd.ExecuteNonQuery();
        }

        public List<Project> GetProjects()
        {
            var list = new List<Project>();
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM projects";
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new Project
                {
                    Id = reader.GetInt32(0),
                    Name = reader.GetString(1)
                });
            }
            return list;
        }

        public void DeleteProject(int id)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "DELETE FROM projects WHERE id = $id";
            cmd.Parameters.AddWithValue("$id", id);
            cmd.ExecuteNonQuery();
        }

        // Project Fields CRUD operations
        public void AddProjectField(int projectId, string name, string type, string? listOptions = null)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "INSERT INTO project_fields (project_id, name, type, list_options) VALUES ($projectId, $name, $type, $listOptions)";
            cmd.Parameters.AddWithValue("$projectId", projectId);
            cmd.Parameters.AddWithValue("$name", name);
            cmd.Parameters.AddWithValue("$type", type);
            cmd.Parameters.AddWithValue("$listOptions", listOptions ?? (object)DBNull.Value);
            cmd.ExecuteNonQuery();
        }

        public List<ProjectField> GetProjectFields(int projectId)
        {
            var list = new List<ProjectField>();
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM project_fields WHERE project_id = $projectId";
            cmd.Parameters.AddWithValue("$projectId", projectId);
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new ProjectField
                {
                    Id = reader.GetInt32(0),           // id
                    ProjectId = reader.GetInt32(1),    // project_id
                    Name = reader.GetString(2),        // name
                    Type = reader.GetString(3),        // type
                    ListOptions = reader.IsDBNull(4) ? null : reader.GetString(4) // list_options
                });
            }
            return list;
        }

        public void DeleteProjectField(int fieldId)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "DELETE FROM project_fields WHERE id = $id";
            cmd.Parameters.AddWithValue("$id", fieldId);
            cmd.ExecuteNonQuery();
        }
    }
}