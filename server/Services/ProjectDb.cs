using Microsoft.Data.Sqlite;
using System.Collections.Generic;

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
    }
}