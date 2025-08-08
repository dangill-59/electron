using Microsoft.Data.Sqlite;
using System.Collections.Generic;

namespace DocumentDmsServer.Services
{
    public class RoleDb
    {
        private readonly string _connStr = "Data Source=documentdms.db";
        public RoleDb()
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = @"CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                name TEXT)";
            cmd.ExecuteNonQuery();

            // Create role_projects table for many-to-many relationships
            cmd.CommandText = @"CREATE TABLE IF NOT EXISTS role_projects (
                role_id INTEGER NOT NULL,
                project_id INTEGER NOT NULL,
                PRIMARY KEY (role_id, project_id),
                FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
                FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE)";
            cmd.ExecuteNonQuery();

            // Create indexes for performance
            cmd.CommandText = @"CREATE INDEX IF NOT EXISTS idx_role_projects_role_id ON role_projects (role_id)";
            cmd.ExecuteNonQuery();
            cmd.CommandText = @"CREATE INDEX IF NOT EXISTS idx_role_projects_project_id ON role_projects (project_id)";
            cmd.ExecuteNonQuery();

            // Seed basic roles if they don't exist
            SeedBasicRoles();
        }

        private void SeedBasicRoles()
        {
            var basicRoles = new[] { "superadmin", "admin", "user", "viewer" };
            
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            
            foreach (var roleName in basicRoles)
            {
                var cmd = conn.CreateCommand();
                cmd.CommandText = "INSERT OR IGNORE INTO roles (name) VALUES ($name)";
                cmd.Parameters.AddWithValue("$name", roleName);
                cmd.ExecuteNonQuery();
            }
        }

        public void AddRole(string name)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "INSERT OR IGNORE INTO roles (name) VALUES ($name)";
            cmd.Parameters.AddWithValue("$name", name);
            cmd.ExecuteNonQuery();
        }

        public List<Role> GetRoles()
        {
            var list = new List<Role>();
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM roles";
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new Role
                {
                    Id = reader.GetInt32(0),
                    Name = reader.GetString(1)
                });
            }
            return list;
        }

        public Role? GetRoleById(int id)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM roles WHERE id = $id";
            cmd.Parameters.AddWithValue("$id", id);
            using var reader = cmd.ExecuteReader();
            if (reader.Read())
            {
                return new Role
                {
                    Id = reader.GetInt32(0),
                    Name = reader.GetString(1)
                };
            }
            return null;
        }

        public Role? GetRoleByName(string name)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM roles WHERE name = $name";
            cmd.Parameters.AddWithValue("$name", name);
            using var reader = cmd.ExecuteReader();
            if (reader.Read())
            {
                return new Role
                {
                    Id = reader.GetInt32(0),
                    Name = reader.GetString(1)
                };
            }
            return null;
        }

        public Role GetRoleWithProjects(int roleId)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            
            // Get role
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM roles WHERE id = $id";
            cmd.Parameters.AddWithValue("$id", roleId);
            
            Role? role = null;
            using var reader = cmd.ExecuteReader();
            if (reader.Read())
            {
                role = new Role
                {
                    Id = reader.GetInt32(0),
                    Name = reader.GetString(1)
                };
            }
            reader.Close();
            
            if (role == null) throw new ArgumentException("Role not found");

            // Get role's projects
            cmd = conn.CreateCommand();
            cmd.CommandText = @"SELECT project_id FROM role_projects WHERE role_id = $roleId";
            cmd.Parameters.AddWithValue("$roleId", roleId);
            
            using var projectReader = cmd.ExecuteReader();
            while (projectReader.Read())
            {
                role.ProjectIds.Add(projectReader.GetInt32(0));
            }
            
            return role;
        }

        // New methods for many-to-many role-project relationships

        public void AssignProjectsToRole(int roleId, List<int> projectIds)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            
            // First remove existing projects for this role
            var cmd = conn.CreateCommand();
            cmd.CommandText = "DELETE FROM role_projects WHERE role_id = $roleId";
            cmd.Parameters.AddWithValue("$roleId", roleId);
            cmd.ExecuteNonQuery();

            // Add new projects
            foreach (int projectId in projectIds)
            {
                cmd = conn.CreateCommand();
                cmd.CommandText = "INSERT OR IGNORE INTO role_projects (role_id, project_id) VALUES ($roleId, $projectId)";
                cmd.Parameters.AddWithValue("$roleId", roleId);
                cmd.Parameters.AddWithValue("$projectId", projectId);
                cmd.ExecuteNonQuery();
            }
        }

        public void AddProjectToRole(int roleId, int projectId)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "INSERT OR IGNORE INTO role_projects (role_id, project_id) VALUES ($roleId, $projectId)";
            cmd.Parameters.AddWithValue("$roleId", roleId);
            cmd.Parameters.AddWithValue("$projectId", projectId);
            cmd.ExecuteNonQuery();
        }

        public void RemoveProjectFromRole(int roleId, int projectId)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "DELETE FROM role_projects WHERE role_id = $roleId AND project_id = $projectId";
            cmd.Parameters.AddWithValue("$roleId", roleId);
            cmd.Parameters.AddWithValue("$projectId", projectId);
            cmd.ExecuteNonQuery();
        }

        public List<int> GetRoleProjects(int roleId)
        {
            var projectIds = new List<int>();
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = @"SELECT project_id FROM role_projects WHERE role_id = $roleId";
            cmd.Parameters.AddWithValue("$roleId", roleId);
            
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                projectIds.Add(reader.GetInt32(0));
            }
            return projectIds;
        }

        public void DeleteRole(int id)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "DELETE FROM roles WHERE id = $id";
            cmd.Parameters.AddWithValue("$id", id);
            cmd.ExecuteNonQuery();
        }
    }
}